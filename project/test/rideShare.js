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
