// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "./UniversalContract.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract CrossChainTherapyMarketplace is Initializable, UniversalContractBase, OwnableUpgradeable {
    struct TherapyService {
        address therapist;
        string specialty;
        uint256 rate;
        uint256[] supportedChains;
        bool active;
        uint256 rating;
        uint256 sessionCount;
    }
    
    struct CrossChainBooking {
        uint256 serviceId;
        address client;
        uint256 sourceChain;
        uint256 amount;
        bool completed;
        uint256 timestamp;
    }
    
    mapping(uint256 => TherapyService) public services;
    mapping(bytes32 => CrossChainBooking) public bookings;
    mapping(address => uint256[]) public therapistServices;
    
    uint256 public nextServiceId;
    uint256 public platformFee = 250; // 2.5%
    
    event ServiceListed(uint256 indexed serviceId, address indexed therapist, string specialty);
    event CrossChainSessionBooked(bytes32 indexed bookingId, uint256 serviceId, address client);
    event SessionCompleted(bytes32 indexed bookingId, uint8 rating);
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _gateway) public initializer {
        __Ownable_init(msg.sender);
        gateway = _gateway;
        nextServiceId = 1;
    }

    function setGateway(address _gateway) external override onlyOwner {
        gateway = _gateway;
    }

    function listTherapyService(
        string memory specialty,
        uint256 rate,
        uint256[] memory supportedChains
    ) external {
        require(rate > 0, "Invalid rate");
        require(supportedChains.length > 0, "Must support at least one chain");
        
        services[nextServiceId] = TherapyService({
            therapist: msg.sender,
            specialty: specialty,
            rate: rate,
            supportedChains: supportedChains,
            active: true,
            rating: 50,
            sessionCount: 0
        });
        
        therapistServices[msg.sender].push(nextServiceId);
        
        emit ServiceListed(nextServiceId, msg.sender, specialty);
        nextServiceId++;
    }

    function bookCrossChainSession(
        address therapist,
        uint256 sourceChain,
        bytes calldata paymentData
    ) external payable {
        uint256 serviceId = findServiceByTherapist(therapist);
        require(serviceId > 0, "Service not found");
        require(services[serviceId].active, "Service not active");
        
        bytes32 bookingId = keccak256(abi.encodePacked(
            msg.sender,
            therapist,
            block.timestamp,
            sourceChain
        ));
        
        bookings[bookingId] = CrossChainBooking({
            serviceId: serviceId,
            client: msg.sender,
            sourceChain: sourceChain,
            amount: msg.value,
            completed: false,
            timestamp: block.timestamp
        });
        
        emit CrossChainSessionBooked(bookingId, serviceId, msg.sender);
    }

    function onCall(
        MessageContext calldata context,
        address,
        uint256 amount,
        bytes calldata message
    ) external override onlyGateway {
        // Handle cross-chain booking completion
        bytes32 bookingId = abi.decode(message, (bytes32));
        CrossChainBooking storage booking = bookings[bookingId];
        
        require(!booking.completed, "Already completed");
        booking.completed = true;
        
        // Process payment
        uint256 fee = (amount * platformFee) / 10000;
        uint256 therapistPayment = amount - fee;
        
        TherapyService storage service = services[booking.serviceId];
        payable(service.therapist).transfer(therapistPayment);
        
        service.sessionCount++;
    }

    function completeSession(bytes32 bookingId, uint8 rating) external {
        CrossChainBooking storage booking = bookings[bookingId];
        require(booking.client == msg.sender, "Not authorized");
        require(!booking.completed, "Already completed");
        require(rating >= 1 && rating <= 5, "Invalid rating");
        
        booking.completed = true;
        
        // Update service rating
        TherapyService storage service = services[booking.serviceId];
        uint256 totalRating = (service.rating * service.sessionCount) + (rating * 10);
        service.sessionCount++;
        service.rating = totalRating / service.sessionCount;
        
        // Process payment
        uint256 fee = (booking.amount * platformFee) / 10000;
        uint256 therapistPayment = booking.amount - fee;
        
        payable(service.therapist).transfer(therapistPayment);
        
        emit SessionCompleted(bookingId, rating);
    }

    function findServiceByTherapist(address therapist) internal view returns (uint256) {
        uint256[] memory serviceIds = therapistServices[therapist];
        for (uint256 i = 0; i < serviceIds.length; i++) {
            if (services[serviceIds[i]].active) {
                return serviceIds[i];
            }
        }
        return 0;
    }

    function getServicesBySpecialty(string memory specialty) external view returns (uint256[] memory) {
        uint256[] memory matchingServices = new uint256[](nextServiceId);
        uint256 count = 0;
        
        for (uint256 i = 1; i < nextServiceId; i++) {
            if (services[i].active && 
                keccak256(bytes(services[i].specialty)) == keccak256(bytes(specialty))) {
                matchingServices[count] = i;
                count++;
            }
        }
        
        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = matchingServices[i];
        }
        
        return result;
    }
}