# Smart Contract

# Uzduotis 1
# Buisiness model

`Decentralized ride sharing app that allows users to rent a car with crypto currency.`

## Members

### 1# User

`Users can rent cars from the site. Users wire ethereum to the companies adress upon rental of a car and once again after returning the car.`

### 2# Company

`Can register cars from partnered companies. Wires ethereum to the partners account upon purchase of a new car.`

### 3# Partner

`Sells cars which can be rented by the company. Gets ethereum from the company upon each purchase of a car.`

# Uzduotis 2
# Pseudo code

### rideShare.sol
```
START

set compiler version

CONTRACT Ride_share
    address of the company

    STRUCT User
        user address
        isAdmin bool
        password

    STRUCT Car
        car id
        brand of the car
        model of the car
        unlock cost
        cost of operation per minute
        cost of operation per kilometer
        distance driven
        isAvailable bool

    STRUCT RentLog
        user address
        car id
        timestamp of when the car was rented
        timestamp of when the car was returned

    STRUCT Partner
        partner id
        company address
        name
        array of offored car names
        array of offored car prices

    mapping of users
    mapping of cars
    mapping of rented cars of user
    mapping of rentalLogs
    mapping of partners

    carid uint
    partnerId uint

    FUNCTION addPartners()
        int of partner id
        initializes partner struct in mapping
            id
            address
            name
            offredcars
            priceofcars

    increases partner uint by one
    REPEAT 3 TIMES

    FUNCTION register()
        check if the user does not exist already
        register user

    FUNCTION login()
        check if the user is not registeres already
        log user in

    FUNCTION getUserInfo()
        checks if user exists
        return user info

    FUNCTION registerCar()
        check if user is an admin
        get address of partner company
        wire ETH
        adds car to Cars

    FUNCTION rentCar()
        checks if the car can be rented
        check if the user is registered
        wire ETH
        change car availability
        put car in the rentedCarByUser mapping
        add when car was rented into the rentLog

    FUNCTION returnCar()
        checks if the cars is rented
        checks if the user is registered
        adds return timestamp to rentLog
        wires ETH
        FOR i IN rentedCarsByUser
            IF i == carId  
                remove the car from map
        set car availabilit to true

    FUNCTION getCarDetails()
        check if car exists
        RETURN car info

    FUNCTION getNextCarId()
        RETURN next id of car

    FUNCTION getRentedCarsByUser()
        check if iser is registered
        RETURN cars rentef by user

    FUNCTION getRentalLog()
        RETURN rental info

    FUNCTION getPartnerDetails()
        check if partner exists
        RETURN partner info



    
```
## Uzduoties 5 javascript Pseudo Code
### index.js

```plaintext
START

IMPORT web3
IMPORT bootstrap
IMPORT configuration json

set contract address
set contract ABI

web3 variable
rideShare variable

WINDOW ON LOAD
    IF windows is not undefined
        set web3 window
        TRY
            initialize the contract
            reveal login form
        CATCH
            throw error that MetaMask Connection was denied
    ELSE
        alert that a MetaMask needs to be installed

DOCUMENT get registration form
    GET password
    GET if user is admin
    TRY
        GET accounts
        get user address
        call register() function in contract
    CATCH
        registration error

DOCUMENT get show registration form
    hide login form
    reveal registration form

DOCUMENT get show login form
    hide registration form
    reveal login form

DOCUMENT get login form
    get password
    TRY
        accounts
        get user address
        call login() function from contract
        IF login is succesful
            call getUserInfo() function from contract
            get if user is an admin
            get profile address
            get role
            get login form
            get register form
            get profile
            call handleLoginSuccess()
        ELSE
            alert that password is invalid
    CATCH
        throw login failed

FUNCTION loadPartners()
    get accounts
    get user address
    call addPartners() from contract
    TRY
        get account
        get user address
        get partnerSelect 
        set placeholder html
        FOR i IN number of partners
            get partner details
            CREATE option element
            set value to partner id
            set text to brand name
            add partner to select
    CATCH
        throw partner loading error

DOCUMENT partnerSelect
    partnerId
    TRY
        get account
        get user address
        call getPartnerDetails() function from contract
        get car model
        get car price
        set placeholder html
        FOR EACH partner
            CREATE option element
                set model
                set price
                add the option
        IF car model selected
            add car price
    CATCH
        throw loading partners error

DOCUMENT get adminForm
    GET partnerId
    GET brand
    GET model
    GET price
    GET unlockCost
    GET cost per km
    GET cost per min
    GET distance
    IF unlock cost OR distance OR cost per km OR cost per min IS 0
        alert the user to fill input correct data
    ELSE
        TRY
            get account
            get user address
            covert price to ETH
            call registerCar() function from contract
            alert of succesful car registration
        CATCH
            aller failure to register car

IF CarRegistered
    log car is registered

FUNCTION loadAvailableCars()
    get account
    get user address
    TRY
        call getCarDetails() function from contract\
        IF car is available
            display car details in html
            if RENT button is pressed
            call rentCar()
    CATCH
        throw error fetching car

FUNCTION rentCar()
    TRY
        call getCarDetails() function from contract
        get unlock cost
        convert unlock cost
        get users rented cars
        IF users has a rented car
            alert user that they can't rent two cars at a time
        call rentCar() function from contract
        call loadAvailableCars()
        call loadRentedCars()
    CATCH
        aler failure to rent car

FUNCTION loadRentedCars()
    get account
    get user address
    TRY
        call getRentedCarsByUser() fucntion from contract
        IF user has no rented cars
            add html placeholder text
        FOR carId IN rentedCarIds
            TRY
                call getCarDetails() function from contracts
                create a div
                add style to the div
                add html that displays car info
                IF button return is pressed
                    call returnCar() function from contract
            CATCH
                throw failure to fetch car details
    CATCH
        throw error loading cars

FUNCTION returnCar()
    TRY
        call getCarDetails function from contract
        get cost per min
        get cost per km
        get distance
        IF distance LESS THAN 1
            distance is 1
        call getRentalLog() function from contract
        get rented ar timestamp
        get current timestamp
        calculate and convert duration into minutes
        IF duration LESS THAN 1
            duration is 1
        calculate cost by time
        calculate cost by distance
        calculate total cost
        convert cost to ETH
        call returnCar() function from contract
        call loadRentedCars()
        call laodAvailableCars()
    CATCH
        throw error returning car
FUNCTION handleLoginSuccess()
    IF user is an admin
        reveal admin form
        call loadAvailableCars()
        call loadPartners()
    ELSE
        reveal user section
        call loadAvailableCars()
        call loadRentedCars()
    END
```

# Uzduotis 3
# test code

### block class
```js
const RideShare = artifacts.require('Ride_share');
const assert = require('assert');

contract('Ride_share', (accounts) => {
    const [OWNER, ADMIN, USER1, USER2, PARTNER1, PARTNER2] = accounts;

    let instance;

    beforeEach(async () => {
        instance = await RideShare.new();
    });

    it('should allow a user to register', async () => {
        await instance.register('user1password', false, { from: USER1 });
        const userInfo = await instance.getUserInfo({ from: USER1 });

        assert.equal(userInfo[0], USER1, 'User owner address should match');
        assert.equal(userInfo[1], false, 'User should not be admin');
        assert.equal(userInfo[2], 'user1password', 'Password hash should match');
    });

    it('should allow an admin to register a car', async () => {
        await instance.register('adminpassword', true, { from: ADMIN });
        await instance.addPartners({ from: ADMIN });

        await instance.registerCar(
            1,
            'Toyota',
            'Corolla',
            5,
            2,
            1,
            1,
            { from: ADMIN, value: web3.utils.toWei('1', 'ether') }
        );

        const carDetails = await instance.getCarDetails(1);
        assert.equal(carDetails[1], 'Toyota', 'Car brand should be Toyota');
        assert.equal(carDetails[2], 'Corolla', 'Car model should be Corolla');
        assert.equal(carDetails[7], true, 'Car should be available');
    });

    it('should not allow a non-admin to register a car', async () => {
        await instance.register('user1password', false, { from: USER1 });

        try {
            await instance.registerCar(
                1,
                'Ford',
                'Focus',
                5,
                2,
                1,
                1,
                { from: USER1, value: web3.utils.toWei('1', 'ether') }
            );
            assert.fail('Expected revert for non-admin car registration');
        } catch (error) {
            assert(error.message.includes('Only admins can register cars'), 'Revert message should match');
        }
    });

    it('should allow a user to return a car', async () => {
        await instance.register('adminpassword', true, { from: ADMIN });
        await instance.register('user1password', false, { from: USER1 });

        await instance.addPartners({ from: ADMIN });
        await instance.registerCar(
            1,
            'Toyota',
            'Corolla',
            5,
            2,
            1,
            1,
            { from: ADMIN, value: web3.utils.toWei('1', 'ether') }
        );

        await instance.rentCar(1, { from: USER1, value: web3.utils.toWei('0.5', 'ether') });
        await instance.returnCar(1, { from: USER1, value: web3.utils.toWei('0.1', 'ether') });

        const carDetails = await instance.getCarDetails(1);
        assert.equal(carDetails[7], true, 'Car should be available again');
    });

    it('should prevent returning a car that is not rented', async () => {
        await instance.register('adminpassword', true, { from: ADMIN });
        await instance.addPartners({ from: ADMIN });
        await instance.registerCar(
            1,
            'Toyota',
            'Corolla',
            5,
            2,
            1,
            1,
            { from: ADMIN, value: web3.utils.toWei('1', 'ether') }
        );

        try {
            await instance.returnCar(1, { from: USER1, value: web3.utils.toWei('0.1', 'ether') });
            assert.fail('Expected revert for returning a non-rented car');
        } catch (error) {
            assert(error.message.includes('Car is not currently rented'), 'Revert message should match');
        }
    });

    it('should allow an admin to add partners', async () => {
        await instance.addPartners({ from: ADMIN });
        const partnerDetails = await instance.getPartnerDetails(1);

        assert.equal(partnerDetails.name, 'Ford', 'Partner name should be Ford');
    });
});
```

# Uzduotis 4

# Uzduotis 5

`Realizuota naudojant Truffle ir paleista per Ganache local blockchain. Stilizuota naudojant Bootstrap. Funkcionalumas realizuotas naudojant javascript.`

### rideShare.js
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blockchain Ride Sharing</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="style.css" />
    <script src="https://cdn.jsdelivr.net/npm/web3/dist/web3.min.js"></script>
</head>
<body>
<h1>Shopify</h1>

<div class="container mt-5">
    <!-- Login Form -->
    <div class="login-container">
        <form id="loginForm" class="d-none">
            <h4>Login</h4>
            <div class="mb-3">
                <label for="loginPassword" class="form-label">Password</label>
                <input type="password" id="loginPassword" class="form-control" required>
            </div>
            <button type="submit" class="btn btn-success">Login</button>
            <button type="button" id="showRegisterForm" class="btn btn-link">Create an Account</button>
        </form>
    </div>

    <!-- Register Form -->
    <form id="registerForm" class="d-none">
        <h4>Register</h4>
        <div class="mb-3">
            <label for="registerPassword" class="form-label">Password</label>
            <input type="password" id="registerPassword" class="form-control" required>
        </div>
        <div class="mb-3">
            <label for="userRole" class="form-label">Role</label>
            <select id="userRole" class="form-select" required>
                <option value="false">User</option>
                <option value="true">Admin</option>
            </select>
        </div>
        <button type="submit" class="btn btn-primary">Register</button>
        <button type="button" id="showLoginForm" class="btn btn-link">Already have an account? Login</button>
    </form>

    <!-- Profile Section -->
    <div id="profile" class="mt-5 d-none">
        <h4>User Profile</h4>
        <p><strong>Address:</strong> <span id="profileAddress"></span></p>
        <p><strong>Role:</strong> <span id="profileRole"></span></p>
    </div>

    <!-- Admin Section -->
    <form id="adminForm" class="d-none mt-3">
        <h4>Register a Car</h4>
        <div class="mb-3">
            <label for="partnerSelect" class="form-label">Select Partner</label>
            <select id="partnerSelect" class="form-select" required>
                <option value="" selected disabled>Select a Partner</option>
            </select>
        </div>
        <div class="mb-3">
            <label for="carModel" class="form-label">Car Model</label>
            <select id="carModel" class="form-select" required>
                <option value="" selected disabled>Select a Model</option>
            </select>
        </div>
        <div class="mb-3">
            <label for="price" class="form-label">Price</label>
            <input type="text" id="price" class="form-control" readonly>
        </div>
        <div class="mb-3">
            <label for="unlockCost" class="form-label">Unlock Cost</label>
            <input type="number" id="unlockCost" class="form-control" required>
        </div>
        <div class="mb-3">
            <label for="costPerKm" class="form-label">Cost per KM</label>
            <input type="number" id="costPerKm" class="form-control" required>
        </div>
        <div class="mb-3">
            <label for="costPerMin" class="form-label">Cost per Min</label>
            <input type="number" id="costPerMin" class="form-control" required>
        </div>
        <div class="mb-3">
            <label for="distance" class="form-label">Distance</label>
            <input type="number" id="distance" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary">Register Car</button>
    </form>


    <!-- User Section -->
    <div id="userSection" class="d-none mt-3">
        <h4>Available Cars</h4>
        <div id="carList"></div>
        <h4>Rented Cars</h4>
        <div id="rentedCarList"></div>
    </div>
</div>

<script src="index.js" type="module"></script>
<script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.6/dist/umd/popper.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/js/bootstrap.min.js"></script>
</body>
</html>
```