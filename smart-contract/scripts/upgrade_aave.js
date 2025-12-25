const { ethers, upgrades } = require("hardhat");

async function main() {
    const proxyAddress = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
    console.log("Upgrading to AaveSmartBank...");

    const AaveSmartBank = await ethers.getContractFactory("AaveSmartBank");

    // Upgrades the proxy at proxyAddress to the new AaveSmartBank logic
    const upgraded = await upgrades.upgradeProxy(proxyAddress, AaveSmartBank);

    await upgraded.waitForDeployment();
    console.log("-----------------------------------------");
    console.log("Proxy successfully upgraded at:", await upgraded.getAddress());
    console.log("-----------------------------------------");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
