const tickets = artifacts.require('tickets');
const assert = require('assert');

contract('tickets', (accounts) => {
    const BUYER = accounts[1];
    const TICKET_ID = 0;
    
    it('should allow user to buy a ticket', async () => {
        const instance = await tickets.deployed();
        const originalticket = await instance.tickets(TICKET_ID)

        await instance.buyTicket(TICKET_ID, {
            from: BUYER, value: 1e17}
        );

        const updatedticket = await instance.tickets(TICKET_ID)

        assert.equal(updatedticket.owner, BUYER, 'the buyer should now own this ticket');
    });
});