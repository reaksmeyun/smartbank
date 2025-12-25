const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
    console.log("Checking SmartBank at:", PROXY_ADDRESS);

    try {
        const SmartBank = await ethers.getContractFactory("SmartBank");
        const bank = await SmartBank.attach(PROXY_ADDRESS);

        console.log("Fetching owner...");
        const owner = await bank.owner();
        console.log("Owner:", owner);

        console.log("Fetching interest rate...");
        const rate = await bank.INTEREST_RATE_BP();
        console.log("Interest Rate (BP):", rate.toString());

        console.log("Fetching contract balance...");
        const balance = await ethers.provider.getBalance(PROXY_ADDRESS);
        console.log("Contract Balance:", ethers.formatEther(balance), "ETH");

        if (owner === "0x0000000000000000000000000000000000000000") {
            console.warn("WARNING: Contract owner is zero address. Contract might NOT be initialized!");
        } else {
            console.log("Contract seems initialized.");
        }

    } catch (error) {
        console.error("Error during diagnostics:", error.message);
        if (error.message.includes("call revert exception")) {
            console.error("The contract call reverted. This usually means the address is wrong or the contract logic is broken.");
        }
    }
}

main().catch(console.error);
