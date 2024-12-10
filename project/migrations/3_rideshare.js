const rideShare = artifacts.require("Ride_share");

module.exports = function (deployer) {
  deployer.deploy(rideShare);
};