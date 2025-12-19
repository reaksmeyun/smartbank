// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// These are standard "security shields" to prevent hacking
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SmartBank is Ownable, ReentrancyGuard {
    
    // SETTINGS
    uint256 public constant YEARLY_INTEREST_RATE = 500; // This means 5%
    uint256 public constant PERCENT_DIVIDER = 10000;    // Used to calculate percentages accurately
    
    // DATA STORAGE
    mapping(address => uint256) public userSavings;             // Stores how much money each person has
    mapping(address => uint256) public lastInterestUpdateDate;  // Stores the last time they checked in

    // NOTIFICATIONS (Events)
    event MoneyDeposited(address indexed person, uint256 amount);
    event MoneyWithdrawn(address indexed person, uint256 amount);
    event InterestAdded(address indexed person, uint256 amountEarned);

    // When the contract is created, the person who "deploys" it becomes the owner
    constructor() Ownable(msg.sender) {}

    /**
     * @notice Put money into the bank
     */
    function depositMoney() public payable nonReentrant {
        require(msg.value > 0, "You must send some money to deposit");
        
        // 1. Give them their interest earned UP TO THIS MOMENT
        _calculateAndAddInterest(msg.sender);
        
        // 2. Add the new money they just sent to their savings
        userSavings[msg.sender] += msg.value;
        
        emit MoneyDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Take your money back out
     */
    function withdrawMoney(uint256 amountToTakeOut) public nonReentrant {
        // 1. Give them their interest earned UP TO THIS MOMENT
        _calculateAndAddInterest(msg.sender);
        
        // 2. Check if they actually have enough money
        require(userSavings[msg.sender] >= amountToTakeOut, "You don't have enough savings for this");

        // 3. Subtract from their savings and send the real money
        userSavings[msg.sender] -= amountToTakeOut;
        
        (bool sent, ) = msg.sender.call{value: amountToTakeOut}("");
        require(sent, "Failed to send the money back to your wallet");

        emit MoneyWithdrawn(msg.sender, amountToTakeOut);
    }

    /**
     * @dev This is the math engine that runs in the background
     */
    function _calculateAndAddInterest(address person) internal {
        uint256 today = block.timestamp;
        uint256 lastCheckIn = lastInterestUpdateDate[person];

        // If they have money and they haven't been updated in a while...
        if (userSavings[person] > 0 && lastCheckIn > 0) {
            uint256 secondsPassed = today - lastCheckIn;
            
            // MATH: (Savings * 5% * time passed) divided by (Total seconds in a year)
            uint256 moneyEarned = (userSavings[person] * YEARLY_INTEREST_RATE * secondsPassed) / 
                                  (PERCENT_DIVIDER * 365 days);

            if (moneyEarned > 0) {
                userSavings[person] += moneyEarned;
                emit InterestAdded(person, moneyEarned);
            }
        }
        
        // Reset the timer to "now"
        lastInterestUpdateDate[person] = today;
    }

    // This allows people to see their balance easily
    function checkMyBalance(address person) public view returns (uint256) {
        return userSavings[person];
    }

    // If someone just sends money to the contract without clicking "Deposit"
    receive() external payable {
        depositMoney();
    }
}