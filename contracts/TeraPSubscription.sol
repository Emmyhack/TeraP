// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Initializable} from "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import {OwnableUpgradeable} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {ReentrancyGuardUpgradeable} from "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title TeraPSubscription
 * @notice Prepaid therapy plans. Users buy a tier for N billing periods with TERAP; the plan grants a
 *         bundle of session minutes. TeraPCore draws on those minutes (and on the prepaid pool) when a
 *         client books a session with `useSubscription = true`.
 */
contract TeraPSubscription is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable, UUPSUpgradeable {
    using SafeERC20 for IERC20;

    uint256 public constant PERIOD = 30 days;

    struct Tier {
        string name;
        uint256 pricePerPeriod; // TERAP (18 decimals) per 30-day period
        uint256 minutesPerPeriod; // session minutes granted per period
        bool active;
    }

    struct Subscription {
        uint256 tierId;
        uint256 startTime;
        uint256 endTime;
        uint256 minutesRemaining;
        uint256 totalPaid;
    }

    IERC20 public terapToken;
    /// @notice TeraPCore, the only contract allowed to consume/refund minutes
    address public core;

    uint256 public nextTierId;
    mapping(uint256 => Tier) public tiers;
    mapping(address => Subscription) public subscriptions;

    /// @notice TERAP currently held for sessions not yet booked
    uint256 public poolBalance;

    event TierCreated(uint256 indexed tierId, string name, uint256 pricePerPeriod, uint256 minutesPerPeriod);
    event TierUpdated(uint256 indexed tierId, uint256 pricePerPeriod, uint256 minutesPerPeriod, bool active);
    event Subscribed(address indexed user, uint256 indexed tierId, uint256 periods, uint256 paid, uint256 endTime);
    event MinutesReserved(address indexed user, uint256 minutesUsed, uint256 cost);
    event MinutesRefunded(address indexed user, uint256 minutesRestored, uint256 cost);
    event RevenueWithdrawn(address indexed to, uint256 amount);
    event CoreUpdated(address indexed core);

    error NotCore();
    error InvalidTier();
    error TierInactive();
    error ZeroPeriods();
    error NoActiveSubscription();
    error InsufficientMinutes(uint256 remaining, uint256 requested);
    error InsufficientPool(uint256 pool, uint256 requested);
    error ZeroAddress();

    modifier onlyCore() {
        if (msg.sender != core) revert NotCore();
        _;
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address terapToken_, address owner_) external initializer {
        if (terapToken_ == address(0) || owner_ == address(0)) revert ZeroAddress();
        __Ownable_init(owner_);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        terapToken = IERC20(terapToken_);
        nextTierId = 1;
    }

    // ---------------------------------------------------------------------
    // Admin
    // ---------------------------------------------------------------------

    function setCore(address core_) external onlyOwner {
        if (core_ == address(0)) revert ZeroAddress();
        core = core_;
        emit CoreUpdated(core_);
    }

    function createTier(string calldata name, uint256 pricePerPeriod, uint256 minutesPerPeriod)
        external
        onlyOwner
        returns (uint256 tierId)
    {
        tierId = nextTierId++;
        tiers[tierId] =
            Tier({name: name, pricePerPeriod: pricePerPeriod, minutesPerPeriod: minutesPerPeriod, active: true});
        emit TierCreated(tierId, name, pricePerPeriod, minutesPerPeriod);
    }

    function updateTier(uint256 tierId, uint256 pricePerPeriod, uint256 minutesPerPeriod, bool active)
        external
        onlyOwner
    {
        if (tierId == 0 || tierId >= nextTierId) revert InvalidTier();
        Tier storage t = tiers[tierId];
        t.pricePerPeriod = pricePerPeriod;
        t.minutesPerPeriod = minutesPerPeriod;
        t.active = active;
        emit TierUpdated(tierId, pricePerPeriod, minutesPerPeriod, active);
    }

    /// @notice Withdraw TERAP that is not backing outstanding minutes (surplus revenue).
    function withdrawRevenue(address to, uint256 amount) external onlyOwner nonReentrant {
        if (to == address(0)) revert ZeroAddress();
        uint256 surplus = terapToken.balanceOf(address(this)) - poolBalance;
        if (amount > surplus) revert InsufficientPool(surplus, amount);
        terapToken.safeTransfer(to, amount);
        emit RevenueWithdrawn(to, amount);
    }

    // ---------------------------------------------------------------------
    // Users
    // ---------------------------------------------------------------------

    /**
     * @notice Buy or extend a plan. Extending an active plan of the same tier keeps unused minutes;
     *         switching tiers replaces the plan (unused minutes are kept too).
     */
    function subscribe(uint256 tierId, uint256 periods) external nonReentrant {
        if (tierId == 0 || tierId >= nextTierId) revert InvalidTier();
        if (periods == 0) revert ZeroPeriods();
        Tier memory t = tiers[tierId];
        if (!t.active) revert TierInactive();

        uint256 cost = t.pricePerPeriod * periods;
        terapToken.safeTransferFrom(msg.sender, address(this), cost);

        Subscription storage s = subscriptions[msg.sender];
        uint256 base = s.endTime > block.timestamp ? s.endTime : block.timestamp;
        if (s.endTime <= block.timestamp) {
            // expired or new: unused minutes do not carry over
            s.minutesRemaining = 0;
            s.startTime = block.timestamp;
        }
        s.tierId = tierId;
        s.endTime = base + periods * PERIOD;
        s.minutesRemaining += t.minutesPerPeriod * periods;
        s.totalPaid += cost;
        poolBalance += cost;

        emit Subscribed(msg.sender, tierId, periods, cost, s.endTime);
    }

    function getSubscription(address user) external view returns (Subscription memory) {
        return subscriptions[user];
    }

    function isActive(address user) public view returns (bool) {
        return subscriptions[user].endTime > block.timestamp;
    }

    function getTier(uint256 tierId) external view returns (Tier memory) {
        return tiers[tierId];
    }

    function getTiers() external view returns (Tier[] memory list) {
        list = new Tier[](nextTierId - 1);
        for (uint256 i = 1; i < nextTierId; i++) {
            list[i - 1] = tiers[i];
        }
    }

    // ---------------------------------------------------------------------
    // Core hooks
    // ---------------------------------------------------------------------

    /**
     * @notice Consume minutes from `user`'s plan and move `cost` TERAP from the prepaid pool to core
     *         (which escrows it for the session).
     */
    function reserve(address user, uint256 sessionMinutes, uint256 cost) external onlyCore nonReentrant {
        Subscription storage s = subscriptions[user];
        if (s.endTime <= block.timestamp) revert NoActiveSubscription();
        if (s.minutesRemaining < sessionMinutes) revert InsufficientMinutes(s.minutesRemaining, sessionMinutes);
        if (poolBalance < cost) revert InsufficientPool(poolBalance, cost);

        s.minutesRemaining -= sessionMinutes;
        poolBalance -= cost;
        terapToken.safeTransfer(core, cost);

        emit MinutesReserved(user, sessionMinutes, cost);
    }

    /**
     * @notice Restore minutes after a cancelled session. Core must transfer `cost` back before calling.
     */
    function refund(address user, uint256 sessionMinutes, uint256 cost) external onlyCore {
        subscriptions[user].minutesRemaining += sessionMinutes;
        poolBalance += cost;
        emit MinutesRefunded(user, sessionMinutes, cost);
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
