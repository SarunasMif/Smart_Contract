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

    const model = document.getElementById('carModel').value;
    const unlockCost = document.getElementById('unlockCost').value;
    const costPerKm = document.getElementById('costPerKm').value;
    const costPerMin = document.getElementById('costPerMin').value;

    try {
        const accounts = await web3.eth.getAccounts();
        const sender = accounts[0];

        await rideShare.methods.registerCar(model, unlockCost, costPerKm, costPerMin).send({ from: sender });
        alert("Car registered successfully!");
    } catch (error) {
        console.error("Error registering car:", error);
        alert("Failed to register car. Check console for details.");
    }
});

// Fetch available cars for users
async function loadAvailableCars() {
    const accounts = await web3.eth.getAccounts();
    const sender = accounts[0];
    document.getElementById('carList').innerHTML = ""; // Clear the list

    let carId = 1; // Start with the first car
    while (true) {
        try {
            // Fetch car details by ID
            const car = await rideShare.methods.getCarDetails(carId).call({ from: sender });

            // If the car is available, create an HTML element for it
            if (car.isAvailable) {
                const carElement = document.createElement('div');
                carElement.className = "card mb-2";
                carElement.innerHTML = `
                    <div class="card-body">
                        <h5 class="card-title">${car.model}</h5>
                        <p>Unlock Cost: ${car.unlock_cost}</p>
                        <p>Cost per KM: ${car.cost_per_km}</p>
                        <p>Cost per Min: ${car.cost_per_min}</p>
                        <button class="btn btn-primary rentCarButton" data-id="${car.id}">Rent</button>
                    </div>
                `;
                document.getElementById('carList').appendChild(carElement);
            }

            carId++; // Move to the next car ID
        } catch (error) {
            // Stop the loop when no more cars are available
            console.log("No more cars to load:", error);
            break;
        }
    }

    // Add event listeners to "Rent" buttons
    document.querySelectorAll('.rentCarButton').forEach((button) => {
        button.addEventListener('click', async (e) => {
            const carId = e.target.getAttribute('data-id'); // Get car ID from button attribute
            try {
                await rideShare.methods.rentCar(carId).send({ from: sender });
                alert("Car rented successfully!");
                loadAvailableCars(); // Refresh the car list
            } catch (error) {
                console.error("Error renting car:", error);
                alert("Failed to rent car. Check console for details.");
            }
        });
    });
}



// Show appropriate options after login
async function handleLoginSuccess(isAdmin) {
    if (isAdmin) {
        document.getElementById('adminForm').classList.remove('d-none');
    } else {
        document.getElementById('userSection').classList.remove('d-none');
        loadAvailableCars();
    }
}