// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Ride_share {
    address public company_address = 0x3A38B4ed5F68B8BDEe02827878a70D418bF2C9f7;

    struct User {
        address owner;
        bool isAdmin;
        string passwordHash; // Hash of the password
        uint balance;
    }

    struct Car {
        uint256 id;
        string brand;
        string model;
        uint unlock_cost;
        uint cost_per_km;
        uint cost_per_min;
        uint distance;
        bool isAvailable;
    }

    mapping(address => User) private users;
    mapping(uint256 => Car) private cars;
    mapping(address => uint256[]) private rentedCarsByUser;
    uint256 private nextCarId = 1;

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
        // require(msg.value == cars[carId].unlock_cost, "Incorrect payment amount");

        // Transfer funds to the company address
        (bool sent, ) = company_address.call{value: msg.value}("");
        require(sent, "Payment transfer failed");

        // Logic to handle renting process (e.g., payment) can be added here.
        cars[carId].isAvailable = false; // Mark car as rented
        rentedCarsByUser[msg.sender].push(carId);
    }

    function returnCar(uint256 carId) public {
        require(!cars[carId].isAvailable, "Car is not currently rented");
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");

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

    function getCarDetails(uint256 carId)
        public
        view
        returns (
            uint256,
            string memory,
            uint256,
            uint256,
            uint256,
            bool
        )
    {
        Car memory car = cars[carId];
        require(car.id != 0, "Car does not exist");

        return (
            car.id,
            car.model,
            car.unlock_cost,
            car.cost_per_km,
            car.cost_per_min,
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
}
