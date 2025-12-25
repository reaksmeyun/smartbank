// require("@nomicfoundation/hardhat-toolbox");
// require("@openzeppelin/hardhat-upgrades");

// module.exports = {
//   solidity: "0.8.28",
//   paths: {
//     sources: "./smart-contract/contracts", // Hardhat looks here for your .sol files
//     artifacts: "./artifacts",
//     cache: "./cache",
//   }
// };

// require("@nomicfoundation/hardhat-toolbox");
// require("@openzeppelin/hardhat-upgrades");

// module.exports = {
//   solidity: "0.8.28",
//   paths: {
//     sources: "./smart-contract/contracts",
//     artifacts: "./artifacts",
//     cache: "./cache",
//   },
//   networks: {
//     hardhat: {
//       chainId: 31337, // Explicitly setting the default Hardhat chain ID
//     },
//     localhost: {
//       url: "http://127.0.0.1:8545",
//       chainId: 31337,
//     }
//   }
// };

require("@nomicfoundation/hardhat-toolbox");
require("@openzeppelin/hardhat-upgrades");

module.exports = {
  solidity: "0.8.28",
  networks: {
    hardhat: {
      chainId: 1337, // Add this line to match MetaMask's expectations
    },
  },
  paths: {
    sources: "./smart-contract/contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  }
};