// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Ride_share {
    address public company_address = 0x3A38B4ed5F68B8BDEe02827878a70D418bF2C9f7;

    struct User {
        address owner;
        bool isAdmin;
        string passwordHash;
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
    // All the containers that hold information
    uint256 private nextCarId = 1;
    uint256 private nextPartnerId = 1;
    // Responsible for keeping track and setting new id for cars and partners respectively

    function addPartners() public {
        uint256 partnerId = 1;

        partners[partnerId] = Partner ({
            id: partnerId,
            compAdd: 0x1dB3803e9aD2E8c8cBF606c04Eb746Dd97237241,
            name: "Ford",
            offeredCars: ["Focus", "Fiesta", "Puma"],
            priceOfCar: [uint256(25), uint256(20), uint256(15)]
        });

        partnerId++;

        partners[partnerId] = Partner ({
            id: partnerId,
            compAdd: 0x971F599Aab9d617Ca3E47fFab0e9A90900A0cAa4,
            name: "BMW",
            offeredCars: ["116", "330", "118"],
            priceOfCar: [uint256(20), uint256(30), uint256(18)]
        });

        partnerId++;

        partners[partnerId] = Partner ({
            id: partnerId,
            compAdd: 0x1dB3803e9aD2E8c8cBF606c04Eb746Dd97237241,
            name: "Toyota",
            offeredCars: ["Corolla", "Camry", "RAV4"],
            priceOfCar: [uint256(15), uint256(12), uint256(17)]
        });

        partnerId++;
        nextPartnerId = partnerId;
    }
    // Adds partners to the contract

    function register(string memory passwordHash, bool isAdmin) public {
        require(bytes(users[msg.sender].passwordHash).length == 0, "User already registered");
        users[msg.sender] = User(msg.sender, isAdmin, passwordHash);
    }
    // Register user, one user can only have one account either and "Admin" or a "User" account

    function login(string memory passwordHash) public view returns (bool) {
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        return keccak256(abi.encodePacked(passwordHash)) == keccak256(abi.encodePacked(users[msg.sender].passwordHash));
    }
    // Allows the user to login to the dApp and access their specific information 

    function getUserInfo() public view returns (address, bool, string memory) {
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        return (users[msg.sender].owner, users[msg.sender].isAdmin, users[msg.sender].passwordHash);
    }
    // Returns the information of a specific user

    function registerCar(uint partnerId, string memory brand, string memory model, uint unlock_cost, uint cost_per_km, uint cost_per_min, uint distance) public payable {
        require(users[msg.sender].isAdmin, "Only admins can register cars");
        // Makes sure that only the user who is an "Admin" can register a new car

        address partner_address = partners[partnerId].compAdd;
        require(company_address != address(0), "Invalid company address");
        // Gets the address of the partner company

        (bool sent, ) = partner_address.call{value: msg.value}("");
        require(sent, "Payment transfer failed");
        // Sends the required ether to the company address

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
        // Adds the new car to the mapping

        nextCarId++;
    }

    function rentCar(uint256 carId) public payable {
        require(cars[carId].isAvailable, "Car is not available for rent");
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        // User has to be registered and the car has to be available to be rented

        (bool sent, ) = company_address.call{value: msg.value}("");
        require(sent, "Payment transfer failed");
        // Sends the amount of ether specified by the unlock_cost in thar cars struct

        Car storage car = cars[carId];
        car.isAvailable = false;
        // Changes the car availability to false

        rentedCarsByUser[msg.sender].push(carId);

        rentalLogs[carId] = RentLog({
            user: msg.sender,
            carId: carId,
            rentedAt: block.timestamp,
            returnedAt: 0
        });
        // Adds the car rent time to the log mapping and other info necessary for filtering
    }

    function returnCar(uint256 carId) public payable {
        require(!cars[carId].isAvailable, "Car is not currently rented");
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        // Checks if the car is not available and the user is registered

        rentalLogs[carId].returnedAt = block.timestamp;
        // Adds log of when the car is returned

        (bool sent, ) = company_address.call{value: msg.value}("");
        require(sent, "Payment transfer failed");
        // Transfers the amount of calculated bu using the specific cost_per_min nad cost_per_km of the specifc car
        
        uint256[] storage rentedCars = rentedCarsByUser[msg.sender];
        for (uint256 i = 0; i < rentedCars.length; i++) {
            if (rentedCars[i] == carId) {
                rentedCars[i] = rentedCars[rentedCars.length - 1];
                rentedCars.pop();
                break;
            }
        }
        // Removes the car from the rented car mapping

        cars[carId].isAvailable = true;
        // Cars is made available to be rented again
    }

    function getCarDetails(uint256 carId) public view returns (uint256, string memory, string memory, uint, uint, uint, uint, bool) {
        Car memory car = cars[carId];
        require(car.id != 0, "Car does not exist");
        // Checks if a car with that id exists

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
        // Rreturns car info
    }

    function getNextCarId() public view returns (uint256) {
        return nextCarId;
    }

    function getRentedCarsByUser(address user) public view returns (uint256[] memory) {
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        return rentedCarsByUser[user];
    }
    // Returns the cars that are rented by the specific user

    function getRentalLog(uint256 carId) public view returns (address, uint256, uint256, uint256) {
        RentLog memory log = rentalLogs[carId];
        return (log.user, log.carId, log.rentedAt, log.returnedAt);
    }
    // Returns the log of when the car was rented and returned

    function getPartnerDetails(uint256 partnerId) public view returns (uint256 id, address compAdd, string memory name, string[3] memory offeredCars, uint256[3] memory priceOfCar) {
        require(partners[partnerId].id != 0, "Partner does not exist");
        // Checks if the user with the specific id exists

        Partner memory partner = partners[partnerId];

        return (
            partner.id,
            partner.compAdd,
            partner.name,
            partner.offeredCars,
            partner.priceOfCar
        );
    }
    // Returns the details of the partner
}
