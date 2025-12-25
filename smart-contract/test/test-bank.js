
// const { ethers } = require("hardhat");

// async function main() {
//   const [owner] = await ethers.getSigners();
//   const proxyAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
//   const bank = await ethers.getContractAt("SmartBank", proxyAddress);

//   // 1. Fetch data from Blockchain
//   const balance = await bank.getBalance(owner.address);
//   const history = await bank.getHistory(owner.address);
//   const stats = await bank.getBankStatistics();

//   // 2. Format the Output
//   console.log("\n" + "=".repeat(60));
//   console.log("                SMARTBANK CUSTOMER REPORT                ");
//   console.log("=".repeat(60));
//   console.log(`ACCOUNT HOLDER:  ${owner.address}`);
//   console.log(`CURRENT BALANCE: ${ethers.formatEther(balance)} ETH`);
//   console.log(`BANK LIQUIDITY:  ${ethers.formatEther(stats.totalLiquidity)} ETH`);
//   console.log("-".repeat(60));
//   console.log("                TRANSACTION HISTORY                      ");
//   console.log("-".repeat(60));

//   if (history.length === 0) {
//     console.log("   No transactions recorded yet.");
//   } else {
//     // Transform the raw blockchain data into a readable format
//     const cleanHistory = history.map((tx, index) => ({
//       "ID": index + 1,
//       "Activity": tx.txType,
//       "Value (ETH)": ethers.formatEther(tx.amount),
//       "Date/Time": new Date(Number(tx.timestamp) * 1000).toLocaleString()
//     }));

//     // This command generates the clean grid/table
//     console.table(cleanHistory);
//   }

//   console.log("=".repeat(60));
//   console.log("             * Interest is auto-compounded * ");
//   console.log("=".repeat(60) + "\n");
// }

// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error("Critical Error:", error);
//     process.exit(1);
//   });









// TEST SMARTCONTRACT LOGIC
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
// ADD THIS LINE BELOW:
const { time } = require("@nomicfoundation/hardhat-network-helpers"); 

describe("SmartBank Pro - Comprehensive Test Suite", function () {
  // 1. DECLARE THE VARIABLE HERE (Top Level)
  let SmartBank, smartBank, owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    SmartBank = await ethers.getContractFactory("SmartBank");
    
    // 2. ASSIGN THE VALUE HERE
    smartBank = await upgrades.deployProxy(SmartBank, [], {
      initializer: "initialize",
      kind: "uups",
    });
    await smartBank.waitForDeployment();
  });

  // 3. YOUR TEST CASE MUST BE INSIDE THIS "describe" BLOCK
  it("Should resolve withdrawal error after funding the bank", async function () {
      const depositAmt = ethers.parseEther("10.0");
      await smartBank.connect(user1).deposit({ value: depositAmt });

      // Simulate 1 year of interest (approx 5% of 10 ETH = 0.5 ETH)
      await time.increase(31536000); 

      // Force interest calculation
      await smartBank.connect(user1).deposit({ value: ethers.parseEther("0.001") });

      const userBalance = await smartBank.getBalance(user1.address);
      
      // Should fail first because contract balance < userBalance (due to interest)
      await expect(
        smartBank.connect(user1).withdraw(userBalance)
      ).to.be.revertedWith("Bank Liquidity Error: Contact Admin");

      // Fund the bank to cover interest
      const fundingAmt = ethers.parseEther("1.0");
      await smartBank.fundBank({ value: fundingAmt });

      // Now withdrawal should succeed
      await expect(smartBank.connect(user1).withdraw(userBalance)).to.not.be.reverted;
      
      const remainingBalance = await smartBank.getBalance(user1.address);
      expect(remainingBalance).to.equal(0);
  });
});
















// // Trigger Event (Deposit, interest and withdraw)
// const { ethers } = require("hardhat");

// async function main() {
//   const [owner] = await ethers.getSigners();
//   // Using lowercase to avoid checksum errors
//   const proxyAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
//   const bank = await ethers.getContractAt("SmartBank", proxyAddress);

//   console.log("\n--- STARTING TRANSACTIONS ---");

//   // 1. PERFORM DEPOSIT
//   const depositAmt = ethers.parseEther("1.0");
//   console.log(`Sending Deposit: ${ethers.formatEther(depositAmt)} ETH...`);
//   const depTx = await bank.deposit({ value: depositAmt });
//   await depTx.wait();
//   console.log("✅ Deposit Confirmed");

//   // 2. PERFORM WITHDRAW
//   const withdrawAmt = ethers.parseEther("0.5");
//   console.log(`Sending Withdrawal: ${ethers.formatEther(withdrawAmt)} ETH...`);
//   const withTx = await bank.withdraw(withdrawAmt);
//   await withTx.wait();
//   console.log("✅ Withdrawal Confirmed");

//   // 3. GENERATE THE CLEAN REPORT
//   const balance = await bank.getBalance(owner.address);
//   const history = await bank.getHistory(owner.address);

//   console.log("\n" + "=".repeat(65));
//   console.log("                SMARTBANK OFFICIAL STATEMENT                ");
//   console.log("=".repeat(65));
//   console.log(`ACCOUNT HOLDER:  ${owner.address}`);
//   console.log(`CURRENT BALANCE: ${ethers.formatEther(balance)} ETH`);
//   console.log("-".repeat(65));

//   const reportData = history.map((tx, i) => ({
//     "#": i + 1,
//     "Activity": tx.txType,
//     "Amount (ETH)": ethers.formatEther(tx.amount),
//     "Date": new Date(Number(tx.timestamp) * 1000).toLocaleString()
//   }));

//   console.table(reportData);
//   console.log("=".repeat(65) + "\n");
// }

// main()
//   .then(() => process.exit(0))
//   .catch((err) => {
//     console.error("Transaction Error:", err.message);
//     process.exit(1);
//   });







// // switch accounts
// const { ethers } = require("hardhat");

// async function main() {
//   // 1. Get all signers
//   const allAccounts = await ethers.getSigners();
//   const owner = allAccounts[0];
//   const user1 = allAccounts[1]; // This is Account #1

//   const proxyAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
//   const bank = await ethers.getContractAt("SmartBank", proxyAddress);

//   console.log("\n" + "=".repeat(65));
//   console.log(`LOGGING IN AS: Account #1`);
//   console.log(`ADDRESS:       ${user1.address}`);
//   console.log("=".repeat(65));

//   // 2. Perform a deposit AS Account #1
//   const depositAmt = ethers.parseEther("2.5");
//   console.log(`Action: Depositing ${ethers.formatEther(depositAmt)} ETH...`);
  
//   // Notice the .connect(user1) here!
//   const tx = await bank.connect(user1).deposit({ value: depositAmt });
//   await tx.wait();

//   // 3. Fetch History for Account #1
//   const balance = await bank.getBalance(user1.address);
//   const history = await bank.getHistory(user1.address);

//   console.log(`\nCURRENT BALANCE FOR ACCOUNT #1: ${ethers.formatEther(balance)} ETH`);
//   console.log("-".repeat(65));

//   const reportData = history.map((tx, i) => ({
//     "#": i + 1,
//     "Activity": tx.txType,
//     "Amount (ETH)": ethers.formatEther(tx.amount),
//     "Date": new Date(Number(tx.timestamp) * 1000).toLocaleString()
//   }));

//   console.table(reportData);
//   console.log("=".repeat(65) + "\n");
// }

// main().then(() => process.exit(0)).catch(console.error);










// const { ethers } = require("hardhat");

// async function main() {
//   const [owner] = await ethers.getSigners();
//   const proxyAddress = "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512";
//   const bank = await ethers.getContractAt("SmartBank", proxyAddress);

//   // 1. Fetch data from the contract
//   const balance = await bank.getBalance(owner.address);
//   const history = await bank.getHistory(owner.address);
//   const stats = await bank.getBankStatistics();

//   console.log("\n" + "=".repeat(95));
//   console.log("                SMARTBANK OFFICIAL STATEMENT - REVENUE BREAKDOWN");
//   console.log("=".repeat(95));
//   console.log(`ACCOUNT HOLDER:  ${owner.address}`);
//   console.log(`CURRENT BALANCE: ${ethers.formatEther(balance)} ETH`);
//   console.log(`BANK PROFIT:     ${ethers.formatEther(stats.bankProfit)} ETH (Total Fees Collected)`);
//   console.log("-".repeat(95));

//   // 2. Format History with Calculated 10% Fee
//   const reportData = history.map((tx, i) => {
//     let userAmount = ethers.formatEther(tx.amount);
//     let bankFee = "0.00000000";

//     if (tx.txType === "Interest Earned") {
//       // Logic: UserShare is 90% of Total. 
//       // Total = UserShare / 0.9. 
//       // Fee = Total * 0.1
//       const share = parseFloat(userAmount);
//       const fee = (share / 0.9) * 0.1;
//       bankFee = fee.toFixed(18);
//     }

//     return {
//       "#": i + 1,
//       "Activity": tx.txType,
//       "User Amount (90%)": `${userAmount} ETH`,
//       "Bank Fee (10%)": `${bankFee} ETH`,
//       "Date": new Date(Number(tx.timestamp) * 1000).toLocaleString()
//     };
//   });

//   console.table(reportData);
//   console.log("=".repeat(95) + "\n");
// }

// main().then(() => process.exit(0)).catch(console.error);