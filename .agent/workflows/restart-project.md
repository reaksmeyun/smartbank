---
description: How to restart the SmartBank project from scratch
---

Follow these steps if you close everything and want to run it again:

### 1. Start the Blockchain (Terminal 1)
In the root directory:
// turbo
```powershell
npx hardhat node
```
*Keep this terminal open.*

### 2. Deploy the Contract (Terminal 2)
In the root directory:
// turbo
```powershell
npx hardhat run smart-contract/scripts/deploy.js --network localhost
```

### 3. Update the Frontend
1. Look at the output of the deploy command for `SmartBank Proxy deployed to: 0x...`
2. Open [SmartBankConfig.js](file:///d:/camtech/year-3/blockchain-web-3/project/smartbank/Front-End/src/config/SmartBankConfig.js)
3. Paste the new address into `CONTRACT_ADDRESSES.localhost`.

### 4. Reset MetaMask (CRITICAL)
Whenever you restart the Hardhat node, MetaMask will get "Nonce" errors.
1. Open MetaMask.
2. Go to **Settings** > **Advanced**.
3. Scroll down and click **Clear activity tab data** (or "Reset Account").
4. This clears the old history and fixes connection issues.

### 5. Start Frontend (Terminal 3)
In the `Front-End` directory:
// turbo
```powershell
npm start
```

### Tips
- If you see "Assertion failed", don't worry! As long as you see the `deployed to: 0x...` address, it worked.
- The `transactionService` I built will automatically detect that the blockchain has been reset and clear your local dashboard history for you!
