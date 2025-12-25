const { ethers } = require("hardhat");

async function main() {
    const [account0, account1] = await ethers.getSigners();
    // YOU CAN CHANGE THE ACCOUNT HERE
    const sender = account0.address;

    const contract = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9";

    const balance = await ethers.provider.getBalance(sender);
    console.log(`Using Account: ${sender}`);
    console.log(`Sender Balance: ${ethers.formatEther(balance)} ETH`);

    const code = await ethers.provider.getCode(contract);
    console.log(`Contract Code length at ${contract}: ${code.length}`);

    if (code === "0x") {
        console.log("CRITICAL: Contract is NOT deployed at this address!");
    }
}

main().catch(console.error);
