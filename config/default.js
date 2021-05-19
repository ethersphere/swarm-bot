module.exports = {
  bot: {
    token: process.env.BOT_TOKEN,
  },

  ethereum: {
    privateKey: process.env.ETH_PRIVATE_KEY,
    endpoint: "ws://srv02.apyos.com:8546",
  },

  faucet: {
    sprinkle: {
      gbzz: 10000000000000000n,
      eth: 50000000000000000n,
    },
    launchBlockHeight: 4461700,
    channel: "840533720267489280",
  },

  contracts: {
    gbzz: "0x2ac3c1d3e24b45c6c310534bc2dd84b5ed576335",
    sw3: "0xf0277caffea72734853b834afc9892461ea18474",
    faucet: "0x5114e7B44656D6c1906B9509d04779Ff77102382",
  },

  // Can be filtered by names or ids
  // Matches any of the ids or names
  permissions: [
    {
      names: ["@everyone"],
      sprinkles: 3,
    },
    {
      ids: ["840931347370737695", "840931856467492885"],
      names: ["swarm-team", "support-team"],
      sprinkles: Infinity,
      forceSprinkle: true,
    },
    {
      ids: ["811300081441046529"],
      names: ["swarm-team"],
      cleaner: true,
    },
  ],

  redis: {
    host: "redis",
    port: 6379,
    db: 0,
  },

  server: "840525910624960512",

  jobs: {
    fund: {
      checkInterval: 1000, // In ms
      maxFundInterval: 60 * 1000, // In ms
      minQueue: 1, // Number of addresses in queue to force a transaction
      maxBatch: 50, // Maximum number of transactions to do at the same time
    },
  },
};
