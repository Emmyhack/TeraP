// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./UniversalContract.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./TeraPToken.sol";
import "./TeraPTherapist.sol";

contract TeraPCoreMinimal is 
    Initializable,
    UniversalContractBase, 
    ERC721Upgradeable,
    OwnableUpgradeable 
{
    TeraPToken public terapToken;
    TeraPTherapist public therapistContract;
    
    struct TherapySession {
        uint256 sessionId;
        address therapist;
        address client;
        uint256 duration;
        uint256 cost;
        uint256 timestamp;
        bool isCompleted;
        bool isPaid;
        uint8 clientRating;
        string encryptedNotes;
    }
    
    mapping(uint256 => TherapySession) public sessions;
    mapping(address => uint256[]) public therapistSessions;
    mapping(address => uint256[]) public clientSessions;
    
    uint256 public nextSessionId;
    uint256 public daoTreasury;
    uint256 public platformFeePercentage;
    
    event SessionBooked(uint256 indexed sessionId, address indexed therapist, address indexed client);
    event SessionCompleted(uint256 indexed sessionId, uint8 clientRating);
    event CrossChainPaymentReceived(address indexed from, uint256 amount, uint256 chainId);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _terapToken,
        address _therapistContract,
        string memory _name,
        string memory _symbol,
        address _gateway
    ) public initializer {
        __ERC721_init(_name, _symbol);
        __Ownable_init(msg.sender);
        
        terapToken = TeraPToken(_terapToken);
        therapistContract = TeraPTherapist(_therapistContract);
        gateway = _gateway;
        platformFeePercentage = 25;
        nextSessionId = 1;
    }

    function setGateway(address _gateway) external override onlyOwner {
        require(_gateway != address(0), "Invalid gateway");
        gateway = _gateway;
    }

    function onCall(
        MessageContext calldata context,
        address,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        bytes4 selector = bytes4(message[:4]);
        
        if (selector == this.bookSessionCrossChain.selector) {
            (address therapist, uint256 duration, string memory notes) = abi.decode(
                message[4:], 
                (address, uint256, string)
            );
            _bookSessionInternal(context.sender, therapist, duration, amount, notes);
        }
        
        emit CrossChainPaymentReceived(context.sender, amount, context.chainID);
    }

    function bookSession(
        address therapist,
        uint256 duration,
        string memory encryptedNotes
    ) external {
        require(therapistContract.verifiedTherapists(therapist), "Not verified");
        require(duration > 0, "Invalid duration");
        
        uint256 cost = calculateSessionCost(therapist, duration);
        require(terapToken.balanceOf(msg.sender) >= cost, "Insufficient balance");
        
        _bookSessionInternal(msg.sender, therapist, duration, cost, encryptedNotes);
    }

    function _bookSessionInternal(
        address client,
        address therapist,
        uint256 duration,
        uint256 cost,
        string memory encryptedNotes
    ) internal {
        uint256 sessionId = nextSessionId++;
        
        sessions[sessionId] = TherapySession({
            sessionId: sessionId,
            therapist: therapist,
            client: client,
            duration: duration,
            cost: cost,
            timestamp: block.timestamp,
            isCompleted: false,
            isPaid: false,
            clientRating: 0,
            encryptedNotes: encryptedNotes
        });
        
        therapistSessions[therapist].push(sessionId);
        clientSessions[client].push(sessionId);
        
        terapToken.transferFrom(client, address(this), cost);
        
        emit SessionBooked(sessionId, therapist, client);
    }

    function completeSession(uint256 sessionId, uint8 rating) external {
        TherapySession storage session = sessions[sessionId];
        require(session.client == msg.sender, "Not client");
        require(!session.isCompleted, "Already completed");
        require(rating >= 1 && rating <= 5, "Invalid rating");
        
        session.isCompleted = true;
        session.isPaid = true;
        session.clientRating = rating;
        
        uint256 platformFee = (session.cost * platformFeePercentage) / 1000;
        uint256 therapistPayment = session.cost - platformFee;
        
        terapToken.transfer(session.therapist, therapistPayment);
        daoTreasury += platformFee;
        
        therapistContract.updateTherapistRating(session.therapist, rating);
        
        emit SessionCompleted(sessionId, rating);
    }

    function calculateSessionCost(address therapist, uint256 duration) public view returns (uint256) {
        require(therapistContract.verifiedTherapists(therapist), "Not verified");
        TeraPTherapist.TherapistProfile memory profile = therapistContract.getTherapistProfile(therapist);
        return (profile.hourlyRate * duration) / 60;
    }

    function bookSessionCrossChain(address, uint256, string memory) external pure {
        revert("Use cross-chain call");
    }

    function getSession(uint256 sessionId) external view returns (TherapySession memory) {
        return sessions[sessionId];
    }
}