import Web3 from "web3";
import 'bootstrap/dist/css/bootstrap.css';
import configuration from '../build/contracts/Tickets.json';
import ticketImage from './images/ticket.jpg';

const createElementFromString = (string) => {
    const div = document.createElement('div');
    div.innerHTML = string.trim();
    return div.firstChild;
};

const CONTRACT_ADDRESS = configuration.networks['5777'].address;
const CONTRACT_ABI = configuration.abi;

let web3;
if (window.ethereum) {
    web3 = new Web3(window.ethereum); // MetaMask provider
} else {
    web3 = new Web3('http://127.0.0.1:7545'); // Local fallback
}

const contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);

const TOTAL_TICKETS = 10;
const EMPTY_ADDRESS = "0x0000000000000000000000000000000000000000";
let account;

const accountEl = document.getElementById('account');
const ticketsEl = document.getElementById('tickets');

const buyTicket = async (ticket) => {
    await contract.methods.buyTicket(ticket.id).send({
        from: account,
        value: ticket.price
    });
    await refreshTickets();
}

const refreshTickets = async () => {
    ticketsEl.innerHTML = '';

    for (let i = 0; i < TOTAL_TICKETS; i++) {
        const ticket = await contract.methods.tickets(i).call();
        // console.log(ticket);
        ticket.id = i;
        if (ticket.owner === EMPTY_ADDRESS) {
            const priceInEther = web3.utils.fromWei(ticket.price, 'ether');

            const ticketEl = createElementFromString(`
                <div class="ticket card" style="width: 18rem;">
                    <img src="${ticketImage}" class="card-img-top" alt="...">
                    <div class="card-body">
                        <p class="card-text">${priceInEther} ETH</p>
                        <button class="btn btn-primary">Buy</button>
                    </div>
                </div>
            `);
            const button = ticketEl.querySelector('button');
            button.addEventListener('click', () => buyTicket(ticket));
            ticketsEl.appendChild(ticketEl);
        }
    }
};


const main = async () => {
    try {
        if (window.ethereum) {
            await window.ethereum.request({ method: 'eth_requestAccounts' }); // MetaMask connection
            const accounts = await web3.eth.getAccounts();
            account = accounts[0];
            accountEl.innerText = account;
            await refreshTickets();
        } else {
            console.error('No Ethereum provider detected.');
            accountEl.innerText = 'Install MetaMask to connect.';
        }
    } catch (error) {
        console.error('Error:', error);
        accountEl.innerText = 'Error connecting to wallet.';
    }
};

main();
