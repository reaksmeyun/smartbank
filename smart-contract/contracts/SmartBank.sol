// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SmartBank {
    
    mapping(address => uint256) public balances; 
    
    uint256 public constant INTEREST_RATE_BP = 500;
    uint256 public constant BASE_RATE_FACTOR = 10000;
    
    mapping(address => uint256) public lastInterestCalculationTime;
    
    address public owner;

    event Deposit(address indexed user, uint256 amount);
    event Withdrawal(address indexed user, uint256 amount);
    event InterestApplied(address indexed user, uint256 principal, uint256 interestAmount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function deposit() public payable {
        _applyInterest(msg.sender);
        
        balances[msg.sender] = balances[msg.sender] + msg.value;
        
        emit Deposit(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) public {
        _applyInterest(msg.sender);
        
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        balances[msg.sender] = balances[msg.sender] - amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Ether transfer failed");
        
        emit Withdrawal(msg.sender, amount);
    }

    function _applyInterest(address user) internal {
        uint256 currentTime = block.timestamp;
        uint256 lastTime = lastInterestCalculationTime[user];

        if (balances[user] > 0 && lastTime > 0 && currentTime > lastTime) {
            
            uint256 principal = balances[user];

            uint256 interestAmount = (principal * INTEREST_RATE_BP / BASE_RATE_FACTOR) / 365;

            balances[user] = balances[user] + interestAmount;
            
            emit InterestApplied(user, principal, interestAmount);
        }

        lastInterestCalculationTime[user] = currentTime;
        
        if (lastTime == 0 && balances[user] > 0) {
             lastInterestCalculationTime[user] = currentTime;
        }
    }
    
    function rescueEther(uint256 amount) public onlyOwner {
        require(address(this).balance >= amount, "Contract has insufficient Ether to rescue");
        
        (bool success, ) = owner.call{value: amount}("");
        require(success, "Rescue failed");
    }

    receive() external payable {
        deposit();
    }
}