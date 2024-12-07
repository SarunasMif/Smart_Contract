const tickets = artifacts.require("tickets");

module.exports = function (deployer) {
  deployer.deploy(tickets);
};