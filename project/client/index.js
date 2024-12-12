import Web3 from "web3";
import 'bootstrap/dist/css/bootstrap.css';
import configuration from '../build/contracts/Ride_share.json';

const CONTRACT_ADDRESS = configuration.networks['5777'].address;
const CONTRACT_ABI = configuration.abi;
// Holds the address and ABI of the contract

let web3;
let rideShare;

window.addEventListener('load', async () => {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);

        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            rideShare = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

            document.getElementById('loginForm').classList.remove('d-none');
        } catch (error) {
            console.error("User denied MetaMask connection:", error);
            alert("MetaMask connection is required to use this site.");
        }
    } else {
        alert("MetaMask is not installed. Please install it to use this site.");
    }
});
// Deploys the site and requires Meta Mask login and displays the user login

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('registerPassword').value;
    const isAdmin = document.getElementById('userRole').value === "true";

    try {
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        await rideShare.methods.register(web3.utils.sha3(password), isAdmin).send({ from: sender });
        alert("User registered successfully!");
    } catch (error) {
        console.error("Error registering user:", error);
        alert("Registration failed.");
    }
});
// Registration form functionality

document.getElementById('showRegisterForm').addEventListener('click', () => {
    document.getElementById('loginForm').classList.add('d-none');
    document.getElementById('registerForm').classList.remove('d-none');
});
// Functionality for the link that redirects to the registration form

document.getElementById('showLoginForm').addEventListener('click', () => {
    document.getElementById('registerForm').classList.add('d-none');
    document.getElementById('loginForm').classList.remove('d-none');
});
// Functionality for the link that redirects to the login form

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('loginPassword').value;

    try {
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        const isValid = await rideShare.methods.login(web3.utils.sha3(password)).call({ from: sender });
        // Calls the login function from the contract

        if (isValid) {
            alert("Login successful!");
            const userInfo = await rideShare.methods.getUserInfo().call({ from: sender });
            console.log('User Info:', userInfo);

            const isAdmin = userInfo[1]; 
            document.getElementById('profileAddress').textContent = userInfo[0];
            document.getElementById('profileRole').textContent = userInfo[1] ? "Admin" : "User";
            document.getElementById('loginForm').classList.add('d-none');
            document.getElementById('registerForm').classList.add('d-none');
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
// Login form functionality

async function loadPartners() {

    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    await rideShare.methods.addPartners().send({ from: sender }); // this is stupid and wasteful

    try {
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        const partnerSelect = document.getElementById('partnerSelect');
        partnerSelect.innerHTML = '<option value="" selected disabled>Select a Partner</option>';

        for (let i = 1; i <= 4; i++) {
            const partner = await rideShare.methods.getPartnerDetails(i).call({ from: sender });
            console.log("partner id: ", partner[0]);
            const option = document.createElement('option');
            option.value = partner[0]; // Partner id
            option.textContent = partner[2]; // Partner name
            partnerSelect.appendChild(option);
        }
        // Adds all the partner options to the form
    } catch (error) {
        console.error("Error loading partners:", error);
    }
}
// Adds and partners to the contract through the addPartners() function

document.getElementById('partnerSelect').addEventListener('change', async (event) => {
    const partnerId = event.target.value;

    try {
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];
        const partner = await rideShare.methods.getPartnerDetails(partnerId).call({ from: sender });

        const carModelSelect = document.getElementById('carModel');
        const priceInput = document.getElementById('price');

        carModelSelect.innerHTML = '<option value="" selected disabled>Select a Model</option>';
        priceInput.value = "";

        partner[3].forEach((model, index) => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            option.dataset.price = partner[4][index];
            carModelSelect.appendChild(option);
        });
        // Adds the partners cars models

        carModelSelect.addEventListener('change', (event) => {
            const selectedOption = event.target.selectedOptions[0];
            priceInput.value = selectedOption.dataset.price;
        });
        // Automatically adds the price of the specific model
    } catch (error) {
        console.error("Error loading partner models:", error);
    }
});

document.getElementById('adminForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const partnerId = document.getElementById('partnerSelect').value;
    const brand = document.getElementById('partnerSelect').textContent;
    const model = document.getElementById('carModel').value;
    const price = document.getElementById('price').value;
    const unlockCost = document.getElementById('unlockCost').value;
    const costPerKm = document.getElementById('costPerKm').value;
    const costPerMin = document.getElementById('costPerMin').value;
    const distance = document.getElementById('distance').value;

    if (unlockCost < 0 || costPerKm < 0 || costPerMin < 0 || distance < 0 || !model || !price) {
        alert("Please fill out all fields before submitting.");

    }else {
        try {
            const accounts = await web3.eth.getAccounts();
            const sender = accounts[0];
    
            const carPrice = web3.utils.toWei(price.toString(), "ether");
            await rideShare.methods.registerCar(partnerId, brand, model, unlockCost, costPerKm, costPerMin, distance).send({ from: sender, value: carPrice, partnerId: brand });
            // Calls registerCar() function from the contract
            alert("Car registered successfully!");
        } catch (error) {
            console.error("Error registering car:", error);
            alert("Failed to register car. Check console for details.");
        }
    }
});
// Form that allows admin to register a new car into the system


rideShare.events.CarRegistered().on('data', (event) => {
    console.log("Car registered:", event.returnValues);
});

async function loadAvailableCars() {
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    try {
        const nextCarId = await rideShare.methods.getNextCarId().call();
        document.getElementById('carList').innerHTML = "";
        for (let carId = 1; carId < nextCarId; carId++) {
            try {
                const car = await rideShare.methods.getCarDetails(carId).call({ from: sender });
                console.log(`Fetched car ${carId}:`, car);

                if (car[7] == true) {
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
                // Adds the html card element to display the car info
            } catch (error) {
                console.error(`Error fetching car ${carId}:`, error);
            }
        }
        // Goes through all regitered cars and displays all that are available for renting
    } catch (error) {
        console.error("Error loading available cars:", error);
    }
}
// Loads cars that are available to be rented

async function rentCar(carID, sender) {
    try {
        const carDetails = await rideShare.methods.getCarDetails(carID).call({ from: sender });
        const unlockCost = carDetails[3]; 
        const UnlockCost = web3.utils.toWei(unlockCost.toString(), "ether");
        // converts the unlock_cost to ether
        console.log("unlock cost in wei: ", UnlockCost);

        const rentedCarIds = await rideShare.methods.getRentedCarsByUser(sender).call({ from: sender });
        if (rentedCarIds.length >= 1) {
            alert("You can not rent more than one car at a time.");
            return;
        }
        // Checks if the user has already rented a car

        await rideShare.methods.rentCar(carID).send({ from: sender, value: UnlockCost });
        // calls the rend car function
        console.log(`Car with the ID ${carID} rented`);
        loadAvailableCars();
        loadRentedCars();
        // reloads available and rented cars
    } catch (error) {
        console.error(`Error renting car ${carID}:`, error);
        alert("Failed to rent car. Check the console for details.");
    }
}
// Function that allows user to rent a car

async function loadRentedCars() {
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];

    try {
        const rentedCarIds = await rideShare.methods.getRentedCarsByUser(sender).call({ from: sender });
        document.getElementById('rentedCarList').innerHTML = "";

        if (rentedCarIds.length === 0) {
            document.getElementById('rentedCarList').innerHTML = "<p>You have not rented any cars.</p>";
            return;
        }
        // Adds placeholder text if the user has not rented any cars

        for (const carId of rentedCarIds) {
            try {
                const car = await rideShare.methods.getCarDetails(carId).call({ from: sender });

                const carElement = document.createElement('div');
                carElement.className = "card mb-2";
                carElement.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${car[1]}</h5> <!-- car[1] is the model -->
                        <p>Unlock Cost: ${car[2]} ETH</p> <!-- car[2] is unlock_cost -->
                        <p>Cost per KM: ${car[3]} ETH</p>
                        <p>Cost per Min: ${car[4]} ETH</p>
                        <p>Status: ${car[7] ? "Available" : "Rented"}</p> <!-- car[7] is availability -->
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
        // Goes through the cars that user has rented and displays them
    } catch (error) {
        console.error(`Error loading rented cars:`, error);
    }
}
// Loads the cars that are rented by the user

async function returnCar(carId, sender) {
    try {
        const carDetails = await rideShare.methods.getCarDetails(carId).call({ from: sender });
        const perMin = parseInt(carDetails[5]);
        const perKm = parseInt(carDetails[4]);
        let distance = parseInt(carDetails[6]);
        // Grabs the values neccesary to calculate how much the user ows for exploiting the car

        if (distance < 1) {
            distance = 1;
        }
        // Minimum amount of distance is always 1 even if the user drove less

        const rentalLog = await rideShare.methods.getRentalLog(carId).call({ from: sender });
        const rentedAt = parseInt(rentalLog[2]); 
        const currentTime = Math.floor(Date.now() / 1000); 
        const durationInMinutes = Math.max(1, Math.floor((currentTime - rentedAt) / 60));
        // Grabs the cars rent lof and calculats the amount of minutes it was rented for
        
        if (durationInMinutes < 1) {
            durationInMinutes = 1;
        }
        // Minimum duration is 1 min even if the user had it for less amount of time

        const timeCost = durationInMinutes * perMin;
        const distanceCost = distance * perKm;
        const totalCost = timeCost + distanceCost;
        // Calculates the cost of renting the car

        const totalCostInWei = web3.utils.toWei(totalCost.toString(), "ether");
        console.log("Value in Wei: ", totalCostInWei);
        // Transforms the totalCost to ether

        console.log(`Returning car ID ${carId}`);
        console.log(`Duration: ${durationInMinutes} mins, Distance: ${distance} km`);
        console.log(`Total Cost: ${totalCost} Wei`);

        await rideShare.methods.returnCar(carId).send({ from: sender, value: totalCostInWei });
        console.log(`Car with ID ${carId} returned successfully.`);
        // Calls the returnCar() function from the contract

        
        loadRentedCars(); 
        loadAvailableCars();
        // Refreshes the list of available and rented cars
    } catch (error) {
        console.error(`Error returning car ${carId}:`, error);
    }
}


async function handleLoginSuccess(isAdmin) {
    if (isAdmin) {
        document.getElementById('adminForm').classList.remove('d-none');
        loadAvailableCars();
        loadPartners();
    } else {
        document.getElementById('userSection').classList.remove('d-none');
        loadAvailableCars();
        loadRentedCars();
    }
}
// Handles information display after login