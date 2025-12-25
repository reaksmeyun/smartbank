require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
      forking: process.env.MAINNET_RPC_URL ? {
        url: process.env.MAINNET_RPC_URL,
        enabled: process.env.FORKING_ENABLED === "true",
      } : undefined
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 1337,
    }
  },
  paths: {
    sources: "./smart-contract/contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  }
};