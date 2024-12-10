// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Ride_share {
    struct User {
        address owner;
        bool isAdmin;
        string passwordHash; // Hash of the password
    }

    struct Car {
        uint256 id;
        string model;
        uint256 unlock_cost;
        uint256 cost_per_km;
        uint256 cost_per_min;
        bool isAvailable;
    }

    mapping(address => User) private users;
    mapping(uint256 => Car) private cars;
    uint256 private nextCarId = 1;

    function register(string memory passwordHash, bool isAdmin) public {
        require(bytes(users[msg.sender].passwordHash).length == 0, "User already registered");
        users[msg.sender] = User(msg.sender, isAdmin, passwordHash);
    }

    function login(string memory passwordHash) public view returns (bool) {
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        return keccak256(abi.encodePacked(passwordHash)) == keccak256(abi.encodePacked(users[msg.sender].passwordHash));
    }

    function getUserInfo() public view returns (address, bool, string memory) {
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");
        return (users[msg.sender].owner, users[msg.sender].isAdmin, users[msg.sender].passwordHash);
    }

    function registerCar(
        string memory model,
        uint256 unlock_cost,
        uint256 cost_per_km,
        uint256 cost_per_min
    ) public {
        require(users[msg.sender].isAdmin, "Only admins can register cars");

        cars[nextCarId] = Car({
            id: nextCarId,
            model: model,
            unlock_cost: unlock_cost,
            cost_per_km: cost_per_km,
            cost_per_min: cost_per_min,
            isAvailable: true
        });

        nextCarId++;
    }

    function rentCar(uint256 carId) public {
        require(cars[carId].isAvailable, "Car is not available for rent");
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");

        // Logic to handle renting process (e.g., payment) can be added here.
        cars[carId].isAvailable = false; // Mark car as rented
    }

    function returnCar(uint256 carId) public {
        require(!cars[carId].isAvailable, "Car is not currently rented");
        require(bytes(users[msg.sender].passwordHash).length != 0, "User not registered");

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
}
