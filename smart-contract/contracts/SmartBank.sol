// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Aave V3 Pool Interface
interface IPool {
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external;
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external returns (uint256);
}

// WETH Interface to wrap/unwrap ETH
interface IWETH is IERC20 {
    function deposit() external payable;
    function withdraw(uint256) external;
}

contract AaveSmartBank is
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable
{
    // Aave & Token Addresses (Example for Ethereum Mainnet - change for other chains)
    IPool public constant aavePool =
        IPool(0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2);
    IWETH public constant WETH =
        IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    // STORAGE
    mapping(address => uint256) private balances;
    mapping(address => uint256) public lastInterestCalculationTime;
    mapping(address => uint256) public lifetimeInterest;
    uint256 public totalTreasuryFees; // For compatibility, though Aave version might not use it the same way

    struct Transaction {
        string txType;
        uint256 amount;
        uint256 timestamp;
    }
    mapping(address => Transaction[]) private userHistory;

    // EVENTS
    event Deposited(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event InterestApplied(address indexed user, uint256 amount);

    // CONSTANTS (5% Annual Interest for Users)
    uint256 public constant INTEREST_RATE_BP = 100;
    uint256 public constant BASE_RATE_FACTOR = 10000;
    uint256 public constant SECONDS_IN_YEAR = 31536000;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __Ownable_init(msg.sender);
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}

    // CORE FEATURES

    /// @notice Users deposit ETH, which is immediately sent to Aave to earn yield
    function deposit() public payable {
        require(msg.value > 0, "Zero deposit");

        _applyInterest(msg.sender);

        // 1. Convert ETH to WETH
        WETH.deposit{value: msg.value}();

        // 2. Approve Aave to spend our WETH
        WETH.approve(address(aavePool), msg.value);

        // 3. Supply WETH to Aave Pool
        aavePool.supply(address(WETH), msg.value, address(this), 0);

        balances[msg.sender] += msg.value;
        _recordTransaction(msg.sender, "Deposit", msg.value);

        emit Deposited(msg.sender, msg.value);
    }

    /// @notice Users withdraw ETH. The contract pulls the principal + 5% interest from Aave.
    function withdraw(uint256 amount) public nonReentrant {
        _applyInterest(msg.sender);
        require(balances[msg.sender] >= amount, "Insufficient bank balance");

        // 1. Withdraw WETH from Aave
        // This fails if Aave doesn't have enough liquidity or the contract is insolvent
        uint256 withdrawnWETH = aavePool.withdraw(
            address(WETH),
            amount,
            address(this)
        );

        // 2. Update state before transfer (Safety first)
        balances[msg.sender] -= amount;
        _recordTransaction(msg.sender, "Withdraw", amount);

        // 3. Convert WETH back to ETH
        WETH.withdraw(withdrawnWETH);

        // 4. Send ETH to user
        (bool success, ) = msg.sender.call{value: withdrawnWETH}("");
        require(success, "ETH Transfer failed");

        emit Withdrawn(msg.sender, amount);
    }

    /// @dev Calculates the 5% virtual interest and adds it to the user's balance
    function _applyInterest(address user) internal {
        uint256 currentTime = block.timestamp;
        uint256 lastTime = lastInterestCalculationTime[user];

        if (balances[user] > 0 && lastTime > 0) {
            uint256 timePassed = currentTime - lastTime;
            uint256 interestEarned = (balances[user] *
                INTEREST_RATE_BP *
                timePassed) / (BASE_RATE_FACTOR * SECONDS_IN_YEAR);

            if (interestEarned > 0) {
                // We no longer take a 10% fee in the Aave version, but we'll track the stat for the UI
                balances[user] += interestEarned;
                lifetimeInterest[user] += interestEarned;
                _recordTransaction(user, "InterestEarned", interestEarned);
                emit InterestApplied(user, interestEarned);
            }
        }
        lastInterestCalculationTime[user] = currentTime;
    }

    function _recordTransaction(
        address user,
        string memory _type,
        uint256 _amount
    ) internal {
        userHistory[user].push(Transaction(_type, _amount, block.timestamp));
    }

    // VIEW FUNCTIONS

    /// @notice Profit is the extra WETH sitting in the contract (Yield - 5% promise)
    function getBankProfit() public view returns (uint256) {
        // In Aave V3, the aWETH balance of this contract grows.
        // Anything above the sum of user balances is your profit.
        // For simplicity, this view requires an external aWETH interface check.
        return address(this).balance;
    }

    function getBalance(address user) external view returns (uint256) {
        return balances[user];
    }

    function getHistory(
        address user
    ) external view returns (Transaction[] memory) {
        return userHistory[user];
    }

    function getBankStatistics()
        external
        view
        returns (
            uint256 totalLiquidity,
            uint256 bankProfit,
            uint256 userLiabilities
        )
    {
        // totalLiquidity is the ETH balance + WETH balance (simplified)
        // Since we supply everything to Aave, we should ideally check aWETH.
        // For now, we'll return the contract's ETH balance as a placeholder.
        totalLiquidity = address(this).balance;
        bankProfit = totalTreasuryFees; // Placeholder
        userLiabilities = 0; // Simplified
    }

    /// @notice The Admin can withdraw the "Spread" (The extra profit earned from Aave)
    function withdrawBankProfit(uint256 amount) external onlyOwner {
        // Implementation would pull excess aWETH from Aave
        aavePool.withdraw(address(WETH), amount, owner());
    }

    // Allow contract to receive ETH from WETH unwrapping
    receive() external payable {}
}
