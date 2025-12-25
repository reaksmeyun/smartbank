const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    const proxyAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

    console.log(`Debug Script: Attempting deposit with account ${deployer.address}`);

    // Check ETH balance
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Wallet Balance: ${ethers.formatEther(balance)} ETH`);

    if (balance === 0n) {
        throw new Error("Deployer wallet has 0 ETH!");
    }

    // Connect to Contract
    const bank = await ethers.getContractAt("SmartBank", proxyAddress);

    // Attempt Deposit
    console.log("Sending 1.0 ETH deposit...");
    try {
        const tx = await bank.deposit({ value: ethers.parseEther("1.0") });
        console.log(`Transaction Hash: ${tx.hash}`);
        await tx.wait();
        console.log("✅ Deposit Successful! Contract is working.");
    } catch (error) {
        console.error("❌ Deposit Reverted!");
        console.error("Reason:", error.message);
    }
}

main().catch(console.error);
