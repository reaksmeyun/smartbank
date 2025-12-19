const hre = require("hardhat");

async function main() {
  // 1. Get the address from your deployment output
  const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  
  // 2. Connect to our Bank
  const Bank = await hre.ethers.getContractAt("SmartBank", CONTRACT_ADDRESS);
  const [owner] = await hre.ethers.getSigners();

  console.log(`Interacting with Bank using account: ${owner.address}`);

  // 3. Deposit 10 ETH
  console.log("Depositing 10 ETH...");
  const depositTx = await Bank.depositMoney({
    value: hre.ethers.parseEther("10.0") 
  });
  await depositTx.wait();

  // 4. Check Balance immediately
  let balance = await Bank.checkMyBalance(owner.address);
  console.log(`Balance after deposit: ${hre.ethers.formatEther(balance)} ETH`);

  // 5. Fast-forward time (Simulate 1 year passing!)
  console.log("Fast-forwarding time by 1 year...");
  await hre.network.provider.send("evm_increaseTime", [31536000]); 
  await hre.network.provider.send("evm_mine");

  // 6. Trigger a withdrawal of 0 to "refresh" and see interest added
//   console.log("Refreshing balance to collect interest...");
//   const refreshTx = await Bank.depositMoney({ value: 0 }); 
//   await refreshTx.wait();
  console.log("Refreshing balance to collect interest...");
  const refreshTx = await Bank.depositMoney({ value: 1 }); // Send 1 wei instead of 0 
  await refreshTx.wait();

  // 7. Check Balance again
  balance = await Bank.checkMyBalance(owner.address);
  console.log(`Balance after 1 year (5% interest): ${hre.ethers.formatEther(balance)} ETH`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});