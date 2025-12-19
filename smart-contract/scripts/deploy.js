const hre = require("hardhat");

async function main() {
  console.log("Starting deployment...");

  // 1. Tell Hardhat we want to find the "SmartBank" contract
  const SmartBank = await hre.ethers.getContractFactory("SmartBank");

  // 2. Deploy the contract to the network
  const bank = await SmartBank.deploy();

  // 3. Wait for the deployment to finish
  await bank.waitForDeployment();

  // 4. Get the address where the contract lives on the blockchain
  const address = await bank.getAddress();

  console.log("------------------------------------------");
  console.log(`Success! SmartBank deployed to: ${address}`);
  console.log("------------------------------------------");
}

// Standard pattern to handle errors
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});