// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Ride_share {
    address public company_address = 0x3A38B4ed5F68B8BDEe02827878a70D418bF2C9f7;

    struct User {
        address owner;
        bool isAdmin;
        string passwordHash;
        uint balance;
    } // Holds user info

    struct Car {
        uint256 id;
        string brand;
        string model;
        uint unlock_cost;
        uint cost_per_km;
        uint cost_per_min;
        uint distance;
        bool isAvailable;
    } // Holds car info

    struct RentLog {
        address user;
        uint256 carId;
        uint256 rentedAt;
        uint256 returnedAt;
    } // Holds the rental data needed to calculate costs

    struct Partner {
        uint256 id;
        address compAdd;
        string name;
        string[3] offeredCars;
        uint256[3] priceOfCar;
    }

    mapping(address => User) private users;
    mapping(uint256 => Car) private cars;
    mapping(address => uint256[]) private rentedCarsByUser;
    mapping(uint256 => RentLog) private rentalLogs;
    mapping(uint256 => Partner) private partners;
    uint256 private nextCarId = 1;
    uint256 private nextPartnerId = 1;

    event CarRented(address indexed user, uint256 carId, uint256 timestamp);
    event CarReturned(address indexed user, uint256 carId, uint256 timestamp);

    function addPartners() public {
        uint256 partnerId = nextPartnerId;

        partners[partnerId] = Partner ({
            id: partnerId,
            compAdd: 0x1dB3803e9aD2E8c8cBF606c04Eb746Dd97237241,
            name: "Ford",
            offeredCars: ["Focus", "Fiesta", "Puma"],
            priceOfCar: [uint256(25000), uint256(20000), uint256(15000)]
        });

        nextPartnerId++;

        partners[partnerId] = Partner ({
            id: partnerId,
            compAdd: 0x971F599Aab9d617Ca3E47fFab0e9A90900A0cAa4,
            name: "BMW",
            offeredCars: ["116", "330", "118"],
            priceOfCar: [uint256(20000), uint256(30000), uint256(18000)]
        });

        nextPartnerId++;

        partners[partnerId] = Partner ({
            id: partnerId,
            compAdd: 0x1dB3803e9aD2E8c8cBF606c04Eb746Dd97237241,
            name: "Toyota",
            offeredCars: ["Corolla", "Camry", "RAV4"],
            priceOfCar: [uint256(15000), uint256(12000), uint256(17000)]
        });

        nextPartnerId++;
    }

    function register(string memory passwordHash, bool isAdmin) public {
        require(bytes(users[msg.sender].passwordHash).length == 0, "User already registered");
        users[msg.sender] = User(msg.sender, isAdmin, passwordHash, 0);
    }

    function login(string memory passwordHash) public view returns (bool) {
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        return keccak256(abi.encodePacked(passwordHash)) == keccak256(abi.encodePacked(users[msg.sender].passwordHash));
    }

    function getUserInfo() public view returns (address, bool, string memory, uint) {
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        return (users[msg.sender].owner, users[msg.sender].isAdmin, users[msg.sender].passwordHash, users[msg.sender].balance);
    }

    function registerCar(string memory brand, string memory model, uint unlock_cost, uint cost_per_km, uint cost_per_min, uint distance) public {
        require(users[msg.sender].isAdmin, "Only admins can register cars");

        cars[nextCarId] = Car({
            id: nextCarId,
            brand: brand,
            model: model,
            unlock_cost: unlock_cost,
            cost_per_km: cost_per_km,
            cost_per_min: cost_per_min,
            distance: distance,
            isAvailable: true
        });

        nextCarId++;
    }

    function rentCar(uint256 carId) public payable {
        require(cars[carId].isAvailable, "Car is not available for rent");
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");

        // Transfer funds to the company address
        (bool sent, ) = company_address.call{value: msg.value}("");
        require(sent, "Payment transfer failed");

        // Logic to handle renting process (e.g., payment) can be added here.
        // cars[carId].isAvailable = false; // Mark car as rented
        Car storage car = cars[carId];
        car.isAvailable = false;
        rentedCarsByUser[msg.sender].push(carId);

        rentalLogs[carId] = RentLog({
            user: msg.sender,
            carId: carId,
            rentedAt: block.timestamp,
            returnedAt: 0
        });

        emit CarRented(msg.sender, carId, block.timestamp);
    }

    function returnCar(uint256 carId) public payable {
        require(!cars[carId].isAvailable, "Car is not currently rented");
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");

        rentalLogs[carId].returnedAt = block.timestamp;

        // Transfer the payment to the admin address
        (bool sent, ) = company_address.call{value: msg.value}("");
        require(sent, "Payment transfer failed");
        
        uint256[] storage rentedCars = rentedCarsByUser[msg.sender];
        for (uint256 i = 0; i < rentedCars.length; i++) {
            if (rentedCars[i] == carId) {
                rentedCars[i] = rentedCars[rentedCars.length - 1];
                rentedCars.pop();
                break;
            }
        }
        // Logic to handle return process can be added here (e.g., calculate total cost).

        cars[carId].isAvailable = true; // Mark car as available
    }

    function getCarDetails(uint256 carId) public view returns (uint256, string memory, string memory, uint, uint, uint, uint, bool) {
        Car memory car = cars[carId];
        require(car.id != 0, "Car does not exist");

        return (
            car.id,
            car.brand,
            car.model,
            car.unlock_cost,
            car.cost_per_km,
            car.cost_per_min,
            car.distance,
            car.isAvailable
        );
    }

    function getNextCarId() public view returns (uint256) {
        return nextCarId;
    }

    function getRentedCarsByUser(address user) public view returns (uint256[] memory) {
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        return rentedCarsByUser[user];
    }

    function getRentalLog(uint256 carId) public view returns (address, uint256, uint256, uint256) {
        RentLog memory log = rentalLogs[carId];
        return (log.user, log.carId, log.rentedAt, log.returnedAt);
    }

    function getPartnerDetails(uint256 partnerId) public view returns (uint256 id, address compAdd, string memory name, string[3] memory offeredCars, uint256[3] memory priceOfCar) {
        require(partners[partnerId].id != 0, "Partner does not exist");

        Partner memory partner = partners[partnerId];

        return (
            partner.id,
            partner.compAdd,
            partner.name,
            partner.offeredCars,
            partner.priceOfCar
        );
    }
}
