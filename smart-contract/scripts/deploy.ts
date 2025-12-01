import { ethers } from "hardhat";

async function main() {
  const SmartBank = await ethers.getContractFactory("SmartBank");
  const smartBank = await SmartBank.deploy();

  await smartBank.waitForDeployment();

  console.log("SmartBank deployed at:", await smartBank.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});


