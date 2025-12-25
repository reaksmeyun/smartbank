import { ethers } from "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.min.js";

console.log("DEBUG: App.js loaded");

const PROXY_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
const ABI = [
    "function deposit() public payable",
    "function withdraw(uint256 amount) public",
    "function getBalance(address user) view returns (uint256)",
    "function getBankStatistics() view returns (uint256 totalLiquidity, uint256 bankProfit, uint256 userLiabilities)",
    "function owner() view returns (address)",
    "function withdrawFees() external",
    "function lifetimeInterest(address) view returns (uint256)",
    "function lastInterestCalculationTime(address) view returns (uint256)",
    "function getHistory(address) view returns (tuple(string txType, uint256 amount, uint256 timestamp)[])"
];

let provider, signer, contract;

async function init() {
    console.log("DEBUG: Init called");
    if (window.ethereum) {
        provider = new ethers.BrowserProvider(window.ethereum);
        window.ethereum.on('accountsChanged', () => window.location.reload());

        document.getElementById('connectBtn').onclick = () => { console.log("Connect Clicked"); connect(); };
        document.getElementById('switchBtn').onclick = switchAccount;
        document.getElementById('depositBtn').onclick = () => { console.log("Deposit Clicked"); handleAction('deposit'); };
        document.getElementById('withdrawBtn').onclick = () => { console.log("Withdraw Clicked"); handleAction('withdraw'); };

        logStatus("System Ready - Version 1.2");

        // Simple check to see if we are already connected
        try {
            const accounts = await provider.listAccounts();
            if (accounts.length > 0) connect();
        } catch (e) { console.error("Auto-connect error:", e); }
    } else {
        alert("Please install MetaMask to use SmartBank.");
    }
}

async function connect() {
    console.log("DEBUG: Connect called");
    try {
        logStatus("Checking Network...");

        // 1. Force Network Switch to Localhost (Chain ID 31337)
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== '0x539') { // 1337 in hex
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '0x539' }],
                });
            }
        } catch (switchError) {
            console.error("Switch Error:", switchError);
            // If localhost isn't added, add it nicely
            if (switchError.code === 4902 || switchError.code === -32603) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x539',
                        chainName: 'Localhost 8545',
                        rpcUrls: ['http://127.0.0.1:8545'],
                        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 }
                    }],
                });
            }
        }

        logStatus("Requesting Accounts...");
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        contract = new ethers.Contract(PROXY_ADDRESS, ABI, signer);

        document.getElementById('connectBtn').classList.add('hidden');
        document.getElementById('switchBtn').classList.remove('hidden');
        document.getElementById('statusIndicator').classList.replace('bg-slate-300', 'bg-green-500');

        await refreshData();
        logStatus("Wallet Connected Successfully");
    } catch (e) {
        console.error("Connect Failure:", e);
        logStatus("Connection Failed: " + (e.message || "Unknown Error"));
        alert("Connection Failed: " + e.message);
    }
}

async function switchAccount() {
    await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }]
    });
}

async function handleAction(type) {
    console.log(`DEBUG: handleAction ${type}`);
    if (!contract) return alert("Please connect your wallet first.");
    const val = document.getElementById('amtInput').value;
    if (!val || val <= 0) return alert("Enter a valid ETH amount");

    try {
        logStatus(`Confirming ${type}...`);
        const amountWei = ethers.parseEther(val);

        // Manual gas limit to prevent estimation errors on localhost
        const options = (type === 'deposit') ? { value: amountWei, gasLimit: 500000 } : { gasLimit: 500000 };

        const tx = (type === 'deposit')
            ? await contract.deposit(options)
            : await contract.withdraw(amountWei, options); // Withdraw takes arg + options

        logStatus("Transaction Pending...");
        await tx.wait();

        logStatus(`${type.charAt(0).toUpperCase() + type.slice(1)} Successful!`);
        document.getElementById('amtInput').value = "";
        refreshData();
    } catch (e) {
        console.error("FULL ERROR:", e);
        logStatus("Transaction Failed: " + (e.shortMessage || e.message));
        alert("Transaction Failed!\n\nReason: " + (e.reason || e.shortMessage || e.message));
    }
}

async function refreshData() {
    const address = await signer.getAddress();
    // Truncate address for display
    document.getElementById('userAddressDisplay').innerText = `${address.substring(0, 6)}...${address.substring(38)}`;

    try {
        const [walletWei, bankWei, stats, ownerAddr] = await Promise.all([
            provider.getBalance(address),
            contract.getBalance(address),
            contract.getBankStatistics(),
            contract.owner()
        ]);

        document.getElementById('walletBal').innerText = parseFloat(ethers.formatEther(walletWei)).toFixed(4);
        document.getElementById('bankBal').innerText = parseFloat(ethers.formatEther(bankWei)).toFixed(4);
        document.getElementById('treasuryBal').innerText = parseFloat(ethers.formatEther(stats[1])).toFixed(6);

        // New Stats
        try {
            const interest = await contract.lifetimeInterest(address);
            const lastTime = await contract.lastInterestCalculationTime(address);

            document.getElementById('interestEarned').innerText = parseFloat(ethers.formatEther(interest)).toFixed(6);
            document.getElementById('lastInterestTime').innerText = (lastTime > 0)
                ? new Date(Number(lastTime) * 1000).toLocaleString()
                : "Never";
        } catch (e) { console.warn("Contract missing Interest features (Old Version?)"); }

        // History
        try {
            const history = await contract.getHistory(address);
            renderHistory(history);
        } catch (e) { console.warn("Contract missing History features"); }

        // Owner-only features
        if (address.toLowerCase() === ownerAddr.toLowerCase()) {
            const btn = document.getElementById('withdrawFeesBtn');
            btn.classList.remove('hidden');
            btn.onclick = async () => {
                logStatus("Claiming Fees...");
                await (await contract.withdrawFees()).wait();
                logStatus("Fees Claimed");
                refreshData();
            };
        }
    } catch (err) {
        console.error("Data Refresh Error:", err);
    }
}

function renderHistory(history) {
    const tbody = document.getElementById('historyTable');
    tbody.innerHTML = "";
    if (history.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="p-4 text-center text-slate-400">No transactions yet</td></tr>';
        return;
    }

    // Reversed loop for new items first
    for (let i = history.length - 1; i >= 0; i--) {
        const tx = history[i];
        const row = document.createElement('tr');
        row.className = "border-b border-slate-50 hover:bg-slate-50 transition-colors";
        row.innerHTML = `
            <td class="p-4 pl-4 text-blue-600">${tx[0]}</td>
            <td class="p-4">${parseFloat(ethers.formatEther(tx[1])).toFixed(4)}</td>
            <td class="p-4 text-slate-400 font-mono text-xs">${new Date(Number(tx[2]) * 1000).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
    }
}

function logStatus(msg) {
    const el = document.getElementById('statusLog');
    if (el) el.innerText = `SYSTEM: ${msg} • ${new Date().toLocaleTimeString()}`;
}

init();