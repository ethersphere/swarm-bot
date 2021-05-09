module.exports = {
  bot: {
    token: process.env.BOT_TOKEN,
  },

  ethereum: {
    privateKey: process.env.ETH_PRIVATE_KEY,
    endpoint: "http://srv02.apyos.com:8545",
  },

  faucet: {
    sprinkle: {
      gbzz: 100000000000000000n,
      eth: 50000000000000000n,
    },
  },

  contracts: {
    gbzz: "0x2ac3c1d3e24b45c6c310534bc2dd84b5ed576335",
  },

  // Can be filtered by names or ids
  // Matches any of the ids or names
  permissions: [
    {
      names: ["@everyone"],
      sprinkles: 10,
    },
    {
      ids: ["840931347370737695", "840931856467492885"],
      names: ["swarm-team", "support-team"],
      sprinkles: Infinity,
    },
  ],

  redis: {
    host: "redis",
    port: 6379,
    db: 0,
  },
};
