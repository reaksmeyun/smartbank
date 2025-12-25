const { ethers } = require("hardhat");

async function main() {
    const addresses = [
        "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
        "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
        "0x5FbDB2315678afecb367f032d93F642f64180aa3"
    ];

    for (const addr of addresses) {
        const code = await ethers.provider.getCode(addr);
        const balance = await ethers.provider.getBalance(addr);
        console.log(`Address: ${addr}`);
        console.log(`Balance: ${ethers.formatEther(balance)} ETH`);
        console.log(`Code Length: ${code.length}`);
        if (code === "0x") {
            console.log("Status: NO CONTRACT");
        } else {
            console.log("Status: CONTRACT DEPLOYED");
        }
        console.log("-------------------");
    }
}

main().catch(console.error);
