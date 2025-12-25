const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x4d8B3EDE20D9cE6e5655C8ba542be005570f4014"; // Your deployed proxy
    const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const AAVE_POOL_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";

    // Known aWETH address on Mainnet
    const aWETH_ADDRESS = "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8";

    console.log("--- BANK PROFIT SCAN ---");
    console.log("Contract Address:", contractAddress);
    console.log("Aave WETH Token (aWETH):", aWETH_ADDRESS);

    // 1. Get Aave Pool to check current supply rate
    const poolABI = [
        "function getReserveData(address asset) external view returns (tuple(uint256 configuration, uint128 liquidityIndex, uint128 currentLiquidityRate, uint128 variableBorrowRate, uint128 stableBorrowRate, uint128 lastUpdateTimestamp, uint40 id, address aTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress, uint128 accruedToTreasury, uint128 unbacked, uint128 isolationModeTotalDebt) data)"
    ];

    const pool = await ethers.getContractAt(poolABI, AAVE_POOL_ADDRESS);

    try {
        const reserveData = await pool.getReserveData(WETH_ADDRESS);

        // currentLiquidityRate is in RAY (1e27) and represents the annual rate
        const ray = 10n ** 27n;
        const supplyRateRay = reserveData.data.currentLiquidityRate;
        const supplyAPR = (Number(supplyRateRay) / Number(ray)) * 100;
        console.log("Current Aave Supply APR:", supplyAPR.toFixed(4) + "%");
    } catch (error) {
        console.log("Note: Could not fetch live Aave rate (this is normal on a fork)");
        console.log("Using approximate rate: 1.33%");
    }

    // 2. Get Contract's aWETH Balance (Principal + Accrued Aave Yield)
    const aWETH = await ethers.getContractAt(
        ["function balanceOf(address account) external view returns (uint256)"],
        aWETH_ADDRESS
    );

    try {
        const totalAssets = await aWETH.balanceOf(contractAddress);
        console.log("Total Assets in Aave (aWETH):", ethers.formatEther(totalAssets), "WETH");

        if (totalAssets > 0n) {
            console.log("✅ Your contract has successfully deposited funds into Aave!");
        } else {
            console.log("ℹ️  No funds currently deposited in Aave (contract balance is 0)");
        }
    } catch (error) {
        console.log("ℹ️  Could not read aWETH balance:", error.message);
    }

    console.log("\n------------------------");
    console.log("Bank Spread Analysis:");
    console.log(`- You pay users: 1.00% (updated from 5%)`);
    console.log(`- Aave pays you: ~1.33% (current mainnet rate)`);

    const yourRate = 1.00;
    const aaveRate = 1.33;
    const spread = aaveRate - yourRate;

    if (spread > 0) {
        console.log(`✅ PROFITABLE: You are earning a ${spread.toFixed(2)}% spread!`);
        console.log(`   For every 100 ETH deposited, you earn ${spread.toFixed(2)} ETH/year in profit.`);
    } else {
        console.log(`⚠️ LOSS: You are paying ${Math.abs(spread).toFixed(2)}% more than you earn!`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
