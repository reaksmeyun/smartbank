const { ethers } = require("hardhat");

async function main() {
    const PROXY_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";
    const [account0, account1] = await ethers.getSigners();

    // YOU CAN CHANGE THE ACCOUNT HERE
    const sender = account0.address;

    const SmartBank = await ethers.getContractFactory("SmartBank");
    const bank = SmartBank.attach(PROXY_ADDRESS);

    console.log("Checking contract at:", PROXY_ADDRESS);
    console.log("Using Account:", sender);

    try {
        const stats = await bank.getBankStatistics();
        console.log("Total Liquidity (ETH):", ethers.formatEther(stats[0]));
        console.log("Treasury Fees (ETH):", ethers.formatEther(stats[1]));
        console.log("User Liabilities (ETH):", ethers.formatEther(stats[2]));

        const lifetime = await bank.lifetimeInterest(sender);
        console.log("Sender Lifetime Interest:", ethers.formatEther(lifetime));

        const balance = await bank.getBalance(sender);
        console.log("Sender SmartBank Balance:", ethers.formatEther(balance));

    } catch (e) {
        console.error("Error fetching stats:", e.message);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
