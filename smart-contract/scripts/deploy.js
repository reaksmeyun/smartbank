// const { ethers, upgrades } = require("hardhat");

// async function main() {
//   const SmartBank = await ethers.getContractFactory("SmartBankV1");

//   console.log("Deploying SmartBankV1 Proxy...");

//   // This deploys the implementation AND the proxy, and calls initialize()
//   const bank = await upgrades.deployProxy(SmartBank, [], {
//     initializer: "initialize",
//     kind: "uups",
//   });

//   await bank.waitForDeployment();

//   console.log("Proxy deployed to:", await bank.getAddress());
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });


// import hre from "hardhat";
// const { ethers, upgrades } = hre;

// async function main() {
//   // Use the name inside the contract file: "SmartBankV1"
//   const SmartBank = await ethers.getContractFactory("SmartBankV1");

//   console.log("Deploying SmartBankV1 Proxy...");

//   // Deploys Implementation, Proxy, and calls initialize()
//   const bank = await upgrades.deployProxy(SmartBank, [], {
//     initializer: "initialize",
//     kind: "uups",
//   });

//   await bank.waitForDeployment();

//   const proxyAddress = await bank.getAddress();
//   console.log("-----------------------------------------");
//   console.log("SmartBank Proxy deployed to:", proxyAddress);
//   console.log("-----------------------------------------");
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });


// const { ethers, upgrades } = require("hardhat");

// async function main() {
//   const SmartBank = await ethers.getContractFactory("SmartBankV1");

//   console.log("Deploying SmartBankV1 Proxy...");

//   const bank = await upgrades.deployProxy(SmartBank, [], {
//     initializer: "initialize",
//     kind: "uups",
//   });

//   await bank.waitForDeployment();

//   console.log("-----------------------------------------");
//   console.log("SmartBank Proxy address:", await bank.getAddress());
//   console.log("-----------------------------------------");
// }

// main().catch((error) => {
//   console.error(error);
//   process.exitCode = 1;
// });


const { ethers, upgrades } = require("hardhat");

async function main() {
  // Use the name defined in the 'contract' line of SmartBank.sol
  const SmartBank = await ethers.getContractFactory("AaveSmartBank");

  console.log("Deploying AaveSmartBank Proxy...");
  const bank = await upgrades.deployProxy(SmartBank, [], {
    initializer: "initialize",
    kind: "uups",
  });

  await bank.waitForDeployment();
  const address = await bank.getAddress();
  console.log("-----------------------------------------");
  console.log("AaveSmartBank Proxy deployed to:", address);
  console.log("-----------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
