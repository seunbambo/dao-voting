const path = require('path');
const fs = require('fs');
const provider = require('@truffle/hdwallet-provider');
const secrets = JSON.parse(fs.readFileSync('.secrets.json').toString().trim());
module.exports = {
  contracts_build_directory: path.join(__dirname, 'client/src/contracts'),

  networks: {
    development: {
      host: '127.0.0.1', // Localhost (default: none)
      port: 8545, // Standard Ethereum port (default: none)
      network_id: '*', // Any network (default: none)
    },
    rinkeby: {
      provider: () =>
        new provider(
          secrets.privateKeys,
          'https://rinkeby.infura.io/v3/00f6fc5389744f1b85c6123ee40e37a5',
          0,
          3
        ),
      network_id: 4,
    },
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: '0.5.2',
    },
  },
};
