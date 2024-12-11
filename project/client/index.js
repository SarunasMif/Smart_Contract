import Web3 from "web3";
import 'bootstrap/dist/css/bootstrap.css';
import configuration from '../build/contracts/Ride_share.json';

// Dynamic Contract Address and ABI
const CONTRACT_ADDRESS = configuration.networks['5777'].address;
const CONTRACT_ABI = configuration.abi;

let web3;
let rideShare;

window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            rideShare = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

            // Show only the login form initially
            document.getElementById('loginForm').classList.remove('d-none');
        } catch (error) {
            console.error("User denied MetaMask connection:", error);
            alert("MetaMask connection is required to use this site.");
        }
    } else {
        alert("MetaMask is not installed. Please install it to use this site.");
    }
});

// Registration and Login logic
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('registerPassword').value;
    const isAdmin = document.getElementById('userRole').value === "true"; // Admin if "true"

    try {
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        await rideShare.methods.register(web3.utils.sha3(password), isAdmin).send({ from: sender });
        alert("User registered successfully!");

        // Redirect to login form
        document.getElementById('registerForm').classList.add('d-none');
        document.getElementById('loginForm').classList.remove('d-none');
    } catch (error) {
        console.error("Error registering user:", error);
        alert("Registration failed. User already has an account.");
    }
});

document.getElementById('showRegisterForm').addEventListener('click', () => {
    // Hide the login form
    document.getElementById('loginForm').classList.add('d-none');

    // Show the registration form
    document.getElementById('registerForm').classList.remove('d-none');
});


document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('loginPassword').value;

    try {
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        const isValid = await rideShare.methods.login(web3.utils.sha3(password)).call({ from: sender });

        if (isValid) {
            alert("Login successful!");
            const userInfo = await rideShare.methods.getUserInfo().call({ from: sender });
            console.log('User Info:', userInfo);

            const isAdmin = userInfo[1]; 
            document.getElementById('profileAddress').textContent = userInfo[0];
            document.getElementById('profileRole').textContent = userInfo[1] ? "Admin" : "User";

            // Show profile details and hide forms
            document.getElementById('loginForm').classList.add('d-none');
            document.getElementById('profile').classList.remove('d-none');
            handleLoginSuccess(isAdmin);
        } else {
            alert("Invalid password. Please try again.");
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("Login failed. Check the console for details.");
    }
});

// Admin: Register a car
document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const brand = document.getElementById('carBrand').value;
    const model = document.getElementById('carModel').value;
    const unlockCost = document.getElementById('unlockCost').value;
    const costPerKm = document.getElementById('costPerKm').value;
    const costPerMin = document.getElementById('costPerMin').value;
    const distance = document.getElementById('distance').value;

    if (unlockCost < 0 || costPerKm < 0 || costPerMin < 0 || distance < 0) {
        alert("unlock cost, cost per km, cost per min and distance have to larger that 0");

    }else {
        try {
            const accounts = await web3.eth.getAccounts();
            const sender = accounts[0];
    
            await rideShare.methods.registerCar(brand, model, unlockCost, costPerKm, costPerMin, distance).send({ from: sender });
            alert("Car registered successfully!");
            const car = await rideShare.methods.getCarDetails(1).call();
            console.log("car model: ", car.model);
        } catch (error) {
            console.error("Error registering car:", error);
            alert("Failed to register car. Check console for details.");
        }
    }
});

rideShare.events.CarRegistered().on('data', (event) => {
    console.log("Car registered:", event.returnValues);
});


// Fetch available cars for users
async function loadAvailableCars() {
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    try {
        const nextCarId = await rideShare.methods.getNextCarId().call();
        document.getElementById('carList').innerHTML = ""; // Clear the list

        for (let carId = 1; carId < nextCarId; carId++) {
            try {
                const car = await rideShare.methods.getCarDetails(carId).call({ from: sender });
                console.log(`Fetched car ${carId}:`, car); // Debugging log

                // If the car is available, create an HTML element for it
                console.log("car model: ", car[5]);
                if (car[5] == true) {
                    const carElement = document.createElement('div');
                    carElement.className = "card mb-2";
                    carElement.innerHTML = `
                        <div class="card-body">
                            <h5 class="card-title">${car[2]}</h5> <!-- car[1] is the model -->
                            <p>Unlock Cost: ${car[3]} ETH</p> <!-- car[2] is unlock_cost -->
                            <p>Cost per KM: ${car[4]} ETH</p>
                            <p>Cost per Min: ${car[5]} ETH</p>
                            <button class="btn btn-primary rentCarButton" data-id="${car[0]}">Rent</button>
                        </div>
                    `;
                    document.getElementById('carList').appendChild(carElement);
                    const button = carElement.querySelector('button');
                    button.addEventListener('click', () => rentCar(car[0], sender));
                }
            } catch (error) {
                console.error(`Error fetching car ${carId}:`, error); // Debugging log
            }
        }
    } catch (error) {
        console.error("Error loading available cars:", error);
    }
}

async function rentCar(carID, sender) {
    try {
        const carDetails = await rideShare.methods.getCarDetails(carID).call({ from: sender });
        const unlockCost = carDetails[3]; // Assuming the unlock cost is the 3rd element in the array
        const UnlockCost = web3.utils.toWei(unlockCost.toString(), "ether");
        console.log("unlock cost in wei: ", UnlockCost);

        // Check if the user has already rented a car
        const rentedCarIds = await rideShare.methods.getRentedCarsByUser(sender).call({ from: sender });
        if (rentedCarIds.length >= 1) {
            alert("You can not rent more than one car at a time.");
            return;
        }

        // Proceed to rent the car
        await rideShare.methods.rentCar(carID).send({
            from: sender,
            value: UnlockCost // Convert unlock cost to wei
        });
        console.log(`Car with the ID ${carID} rented`);
        loadAvailableCars();
        loadRentedCars();
    } catch (error) {
        console.error(`Error renting car ${carID}:`, error);
        alert("Failed to rent car. Check the console for details.");
    }
}


async function loadRentedCars() {
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    try {
        // Fetch the list of rented car IDs for the logged-in user
        const rentedCarIds = await rideShare.methods.getRentedCarsByUser(sender).call({ from: sender });
        document.getElementById('rentedCarList').innerHTML = ""; // Clear the list

        if (rentedCarIds.length === 0) {
            document.getElementById('rentedCarList').innerHTML = "<p>You have not rented any cars.</p>";
            return;
        }

        // Fetch details of each rented car
        for (const carId of rentedCarIds) {
            try {
                const car = await rideShare.methods.getCarDetails(carId).call({ from: sender });

                // Create an HTML element for the rented car
                const carElement = document.createElement('div');
                carElement.className = "card mb-2";
                carElement.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${car[1]}</h5> <!-- car[1] is the model -->
                        <p>Unlock Cost: ${car[2]} ETH</p> <!-- car[2] is unlock_cost -->
                        <p>Cost per KM: ${car[3]} ETH</p>
                        <p>Cost per Min: ${car[4]} ETH</p>
                        <p>Status: ${car[5] ? "Available" : "Rented"}</p> <!-- car[5] is availability -->
                        <button class="btn btn-secondary returnCarButton" data-id="${car[0]}">Return</button>
                    </div>
                `;
                document.getElementById('rentedCarList').appendChild(carElement);

                const button = carElement.querySelector('button');
                button.addEventListener('click', () => returnCar(car[0], sender));
            } catch (error) {
                console.error(`Error fetching details for rented car ${carId}:`, error);
            }
        }
    } catch (error) {
        console.error(`Error loading rented cars:`, error);
    }
}

async function returnCar(carId, sender) {
    try {
        // Fetch car details
        const carDetails = await rideShare.methods.getCarDetails(carId).call({ from: sender });
        const perMin = parseInt(carDetails[5]); // cost_per_min
        const perKm = parseInt(carDetails[4]);  // cost_per_km
        let distance = parseInt(carDetails[6]); // distance

        // Ensure minimum distance of 1
        if (distance < 1) {
            distance = 1;
        }

        // Fetch rental log to calculate rental duration
        const rentalLog = await rideShare.methods.getRentalLog(carId).call({ from: sender });
        const rentedAt = parseInt(rentalLog[2]); // Convert to integer if not already
        const currentTime = Math.floor(Date.now() / 1000); // Get current time in seconds
        const durationInMinutes = Math.max(1, Math.floor((currentTime - rentedAt) / 60)); // Minimum 1 minute

        // Calculate costs
        const timeCost = durationInMinutes * perMin;
        const distanceCost = distance * perKm;
        const totalCost = timeCost + distanceCost;

        // Convert total cost to Wei for Ethereum transaction
        const totalCostInWei = web3.utils.toWei(totalCost.toString(), "ether");
        console.log("Value in Wei: ", totalCostInWei);

        console.log(`Returning car ID ${carId}`);
        console.log(`Duration: ${durationInMinutes} mins, Distance: ${distance} km`);
        console.log(`Total Cost: ${totalCost} Wei`);

        // Send transaction with the calculated value
        await rideShare.methods.returnCar(carId).send({ from: sender, value: totalCostInWei });
        console.log(`Car with ID ${carId} returned successfully.`);

        // Refresh the lists
        loadRentedCars(); // Refresh the rented cars list
        loadAvailableCars(); // Refresh the available cars list
    } catch (error) {
        console.error(`Error returning car ${carId}:`, error);
    }
}





// Show appropriate options after login
async function handleLoginSuccess(isAdmin) {
    if (isAdmin) {
        document.getElementById('adminForm').classList.remove('d-none');
        document.getElementById('nav-bar').classList.remove('d-none');
        loadAvailableCars();
    } else {
        document.getElementById('userSection').classList.remove('d-none');
        document.getElementById('nav-bar').classList.remove('d-none');
        loadAvailableCars();
        loadRentedCars();
    }
}