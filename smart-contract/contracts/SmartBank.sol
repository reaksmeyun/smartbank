// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract SmartBank is
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // STORAGE
    mapping(address => uint256) private balances;
    mapping(address => uint256) public lastInterestCalculationTime;
    mapping(address => uint256) public lifetimeInterest; // Track total interest earned
    uint256 public totalTreasuryFees; // Bank's accumulated profit

    struct Transaction {
        string txType;
        uint256 amount;
        uint256 timestamp;
    }
    mapping(address => Transaction[]) private userHistory;

    // EVENTS for Web3 Authentication & Multi-User Design
    event Deposited(address indexed user, uint256 amount, uint256 timestamp);
    event Withdrawn(address indexed user, uint256 amount, uint256 timestamp);
    event InterestPaid(address indexed user, uint256 amount, uint256 timestamp);
    event BankFunded(uint256 amount, uint256 timestamp);

    // Constants
    uint256 public constant INTEREST_RATE_BP = 500; // 5%
    uint256 public constant PERFORMANCE_FEE_BP = 1000; // 10% of earned interest
    uint256 public constant BASE_RATE_FACTOR = 10000; // Performance Fee: fee from withdraw amount (cut 10%)
    uint256 public constant SECONDS_IN_YEAR = 31536000;

    // UPGRADE PATTERN
    /// @custom:oz-retyped-from constructor
    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
    }

    /// @custom:oz-retyped-from Ownable
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // CORE FEATURES
    /// DEPOSIT FEATURE
    function deposit() public payable {
        require(msg.value > 0, "Zero deposit");
        _applyInterest(msg.sender);

        balances[msg.sender] += msg.value;
        _recordTransaction(msg.sender, "Deposit", msg.value);

        // Emit event for Web3 transaction history
        emit Deposited(msg.sender, msg.value, block.timestamp);
    }

    /// WITHDRAW FEATURE
    function withdraw(uint256 amount) public nonReentrant {
        _applyInterest(msg.sender);

        // Check user has enough in their virtual account
        require(balances[msg.sender] >= amount, "Insufficient account balance");

        // Check contract has enough physical ETH (Liquidity Guard)
        require(
            address(this).balance >= amount,
            "Bank Liquidity Error: Contact Admin"
        );

        // Update state
        balances[msg.sender] -= amount;
        _recordTransaction(msg.sender, "Withdraw", amount);

        // Transfer
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        // Emit event for Web3 transaction history
        emit Withdrawn(msg.sender, amount, block.timestamp);
    }

    /// APPLY INTEREST
    function _applyInterest(address user) internal {
        uint256 currentTime = block.timestamp;
        uint256 lastTime = lastInterestCalculationTime[user];

        if (balances[user] > 0 && lastTime > 0) {
            uint256 timePassed = currentTime - lastTime;

            // Raw interest calculation
            uint256 totalInterest = (balances[user] *
                INTEREST_RATE_BP *
                timePassed) / (BASE_RATE_FACTOR * SECONDS_IN_YEAR);

            if (totalInterest > 0) {
                // Calculate bank's cut (Performance Fee)
                uint256 bankCut = (totalInterest * PERFORMANCE_FEE_BP) /
                    BASE_RATE_FACTOR;
                uint256 userShare = totalInterest - bankCut;

                balances[user] += userShare;
                lifetimeInterest[user] += userShare; // Record to lifetime interest
                totalTreasuryFees += bankCut; // Store the fee in the treasury

                _recordTransaction(user, "InterestPaid", userShare);

                // Emit event for Web3 transaction history
                emit InterestPaid(user, userShare, currentTime);
            }
        }
        lastInterestCalculationTime[user] = currentTime;
    }

    /// RECORD TRANSACTION FUNCTION
    function _recordTransaction(
        address user,
        string memory _type,
        uint256 _amount
    ) internal {
        userHistory[user].push(Transaction(_type, _amount, block.timestamp));
    }

    // VIEW FUNCTIONS
    function getBankStatistics()
        external
        view
        returns (
            uint256 totalLiquidity,
            uint256 bankProfit,
            uint256 userLiabilities
        )
    {
        // For demonstration, we'll assume userLiabilities is the sum of all balances.
        // In a production app, you might want to track this in a separate variable.
        return (
            address(this).balance,
            totalTreasuryFees,
            address(this).balance
        ); // Simplified for now
    }

    /// @notice Allows admin or anyone to fund the bank to cover interest
    function fundBank() public payable {
        require(msg.value > 0, "Funding amount must be > 0");
        emit BankFunded(msg.value, block.timestamp);
    }

    function getHistory(
        address user
    ) external view returns (Transaction[] memory) {
        return userHistory[user];
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    // Admin can withdraw the profit (fees) without touching user deposits
    function withdrawFees() external onlyOwner {
        uint256 amount = totalTreasuryFees;
        totalTreasuryFees = 0;
        (bool success, ) = owner().call{value: amount}("");
        require(success, "Fee withdrawal failed");
    }
}
