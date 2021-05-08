module.exports = {
  bot: {
    token: process.env.BOT_TOKEN,
  },

  ethereum: {
    privateKey: process.env.ETH_PRIVATE_KEY,
    endpoint: "http://srv02.apyos.com:8545",
  },

  faucet: {
    fund: {
      gbzz: 100000000000000000n,
      eth: 50000000000000000n,
    },
  },

  contracts: {
    gbzz: "0x2ac3c1d3e24b45c6c310534bc2dd84b5ed576335",
  },
};
