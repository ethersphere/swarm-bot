module.exports = {
  bot: {
    token: process.env.BOT_TOKEN,
  },

  ethereum: {
    privateKey: process.env.ETH_PRIVATE_KEY,
    endpoint: "wss://goerli.infura.io/ws/v3/7232dd50de3c49e1842650219cc1626e",
    providerOptions: {
      timeout: 30000,
      clientConfig: {
        keepalive: true,
        keepaliveInterval: 60000,
      },
      reconnect: {
        auto: true,
        onTimeout: true,
        maxAttempts: false,
      },
    },
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
    faucet: "0xf16Ef286ff34008cf643C016851f4c242f49e2C5",
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
      foreignLanguages: true,
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
      maxGasPrice: 1000, // In gwei
    },
  },

  plurRadio: {
    channel: "849257505762574396",
  },
};
