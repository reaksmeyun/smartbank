const { ethers } = require("hardhat");

async function main() {
    console.log("Deploying AaveSmartBank (Simple)...");

    const SmartBank = await ethers.getContractFactory("AaveSmartBank");
    const bank = await SmartBank.deploy();

    await bank.waitForDeployment();
    const address = await bank.getAddress();

    console.log("AaveSmartBank Deployed to:", address);

    // Initialize it manually since we aren't using the proxy
    console.log("Initializing...");
    const tx = await bank.initialize();
    await tx.wait();
    console.log("Initialized!");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
