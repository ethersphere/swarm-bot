const config = require("config");
const { subMilliseconds, formatDistanceToNow } = require("date-fns");
const { getDefaultProvider, Wallet, Contract, utils } = require("ethers");
const abi = require("./abi.json");

// Redis keys
const QUEUE_KEY = "spinkles:queue";
const addressKey = (address) => `address:${address}:sprinkle`;
const sprinklesKey = (user) => `user:${user}:sprinkles`;

// Functions
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const promiseTimeout = (promise, ms) => {
  if (ms < 0) {
    return promise;
  }

  const timeout = new Promise((_, reject) => {
    const id = setTimeout(() => {
      clearTimeout(id);
      reject({ code: "TIMEOUT" });
    }, ms);
  });

  return Promise.race([promise, timeout]);
};
const minBigNumber = (a, b) => {
  return a.gt(b) ? b : a;
};

// Ethers setup
const provider = getDefaultProvider(config.get("ethereum.endpoint"));
const wallet = new Wallet(config.get("ethereum.privateKey"), provider);
const faucet = new Contract(config.get("contracts.faucet"), abi, wallet);

const create = async ({ redis, discord }) => {
  let stop = false;
  const eventTopic = faucet.filters.Funded().topics[0];

  const fund = async (attempt = 0) => {
    const addresses = await redis.lrange(
      QUEUE_KEY,
      0,
      config.get("jobs.fund.maxBatch")
    );
    if (!addresses.length) {
      return;
    }

    const maxGasPrice = config.get("jobs.fund.maxGasPrice").toString();
    const max = utils.parseUnits(maxGasPrice, "gwei");
    const add = utils.parseUnits((2 * attempt).toString(), "gwei");
    const gasPrice = minBigNumber((await provider.getGasPrice()).add(add), max);

    try {
      const tx = await faucet.fund(addresses, { gasPrice });
      console.log(
        `Bulk funding ${addresses.length} addresses at ${tx.hash} (${gasPrice} gwei)`
      );

      const timeout = gasPrice.eq(max) ? -1 : 30 * 1000;
      const result = await promiseTimeout(tx.wait(), timeout);

      // Read all events (which addresses were funded)
      const states = {};
      for (const event of result.events) {
        if (event.topics.includes(eventTopic)) {
          states[event.args.addr] = event.args.state;
        }
      }

      const results = await Promise.all(
        addresses.map(async (address) => ({
          state: states[address] === undefined ? 1 : states[address],
          address,
          ...(await redis.hgetall(addressKey(address))),
        }))
      );

      await redis.lpop(QUEUE_KEY, addresses.length);
      await results.map((result) =>
        redis.sadd(sprinklesKey(result.user), result.address)
      );

      for (const result of results) {
        const channel = discord.guilds.cache
          .get(result.guild)
          .channels.cache.get(config.get("faucet.channel"));

        // This check is temporary for older Redis records
        const time =
          result.date &&
          formatDistanceToNow(new Date(parseInt(result.date)), {
            includeSeconds: true,
          });

        const messages = {
          0: `sprinkled!${time ? ` (${time})` : ""} :bee:`,
          1: "not sprinkled because of an error... :cry:",
          2: "already sprinkled... :no_entry_sign:",
        };
        channel.send(
          `<@${result.user}> Your node ${result.address} was ${
            messages[result.state]
          }`
        );
      }
    } catch (err) {
      if ([-32010, "TIMEOUT"].includes(err.code)) {
        console.log("Transaction timeout or exists");
        return await fund(attempt + 1);
      }

      console.error(err);
    }
  };

  const start = async () => {
    let lastFund = 0;
    while (!stop) {
      const queue = await redis.llen(QUEUE_KEY);
      const time = subMilliseconds(
        new Date(),
        config.get("jobs.fund.maxFundInterval")
      );

      if (queue >= config.get("jobs.fund.minQueue") || lastFund < time) {
        try {
          await fund();
        } catch (err) {
          console.error(err);
        }
        lastFund = new Date();
      }

      // Always add a small delay between funds or checks
      await sleep(config.get("jobs.fund.checkInterval"));
    }
  };

  return {
    start,
    stop: () => {
      stop = true;
    },
  };
};

module.exports = {
  create,
};
