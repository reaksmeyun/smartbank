const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("AaveSmartBank Detailed Logic Test", function () {
    let bank, owner, user1;

    before(async function () {
        const network = await ethers.provider.getNetwork();
        console.log("Testing on Network ChainID:", network.chainId);
    });

    beforeEach(async function () {
        [owner, user1] = await ethers.getSigners();
        const AaveSmartBank = await ethers.getContractFactory("AaveSmartBank");
        bank = await upgrades.deployProxy(AaveSmartBank, [], { initializer: "initialize", kind: "uups" });
        await bank.waitForDeployment();
    });

    describe("1. Core Banking Functions", function () {
        it("should accept deposits and supply to Aave", async function () {
            const amount = ethers.parseEther("10");
            await expect(bank.connect(user1).deposit({ value: amount }))
                .to.emit(bank, "Deposited")
                .withArgs(user1.address, amount);

            expect(await bank.getBalance(user1.address)).to.equal(amount);
        });

        it("should handle partial withdrawals correctly", async function () {
            const depositAmount = ethers.parseEther("10");
            await bank.connect(user1).deposit({ value: depositAmount });

            const withdrawAmount = ethers.parseEther("4");
            await expect(bank.connect(user1).withdraw(withdrawAmount))
                .to.emit(bank, "Withdrawn")
                .withArgs(user1.address, withdrawAmount);

            // Use closeTo because tiny interest might accrue between blocks
            expect(await bank.getBalance(user1.address)).to.be.closeTo(ethers.parseEther("6"), ethers.parseEther("0.0001"));
        });

        it("should revert if withdrawing more than balance", async function () {
            await bank.connect(user1).deposit({ value: ethers.parseEther("1") });
            await expect(bank.connect(user1).withdraw(ethers.parseEther("2")))
                .to.be.revertedWith("Insufficient bank balance");
        });
    });

    describe("2. Interest Logic (5% APR)", function () {
        it("should accrue interest precisely over 1 year", async function () {
            const principal = ethers.parseEther("100");
            await bank.connect(user1).deposit({ value: principal });

            // Jump forward 1 year
            await time.increase(31536000);

            // Interest calculation happens on next interaction
            // Using 0.001 ETH because 0 is reverted
            await bank.connect(user1).deposit({ value: ethers.parseEther("0.001") });

            const newBalance = await bank.getBalance(user1.address);
            // Expected: 100 principal + 5 interest + 0.001 deposit = 105.001 ETH
            expect(newBalance).to.be.closeTo(ethers.parseEther("105.001"), ethers.parseEther("0.01"));
        });

        it("should track lifetime interest", async function () {
            await bank.connect(user1).deposit({ value: ethers.parseEther("10") });
            await time.increase(31536000);
            await bank.connect(user1).deposit({ value: ethers.parseEther("0.001") }); // Trigger interest

            const lifetime = await bank.lifetimeInterest(user1.address);
            expect(lifetime).to.be.closeTo(ethers.parseEther("0.5"), ethers.parseEther("0.01"));
        });
    });

    describe("3. Admin & Safety", function () {
        it("should only allow owner to withdraw bank spread", async function () {
            await expect(bank.connect(user1).withdrawBankProfit(100))
                .to.be.revertedWithCustomError(bank, "OwnableUnauthorizedAccount");
        });

        it("should return history for records", async function () {
            await bank.connect(user1).deposit({ value: ethers.parseEther("1") });
            await bank.connect(user1).withdraw(ethers.parseEther("0.5"));

            const history = await bank.getHistory(user1.address);
            // It might be 3 if interest was applied during withdrawal
            expect(history.length).to.be.at.least(2);

            const types = history.map(h => h.txType);
            expect(types).to.include("Deposit");
            expect(types).to.include("Withdraw");
        });
    });
});
