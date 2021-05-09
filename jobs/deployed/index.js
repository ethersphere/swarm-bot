const config = require("config");
const { getDefaultProvider, utils, Contract } = require("ethers");

// ABI
const sw3Abi = require("./abis/sw3.json");
const ssAbi = require("./abis/ss.json");

// Config
const DEPLOYED_KEY = "events:simple-swap-deployed:blockNumber";

// Redis keys
const deployedKey = (user) => `user:${user}:deployed`;

const cleanOutput = (object) => {
  const result = { ...object };
  for (const [key, value] of Object.entries(result)) {
    if (!isNaN(Number(key))) {
      delete result[key];
    } else if (typeof value === "object") {
      result[key] = cleanOutput(value);
    }
  }
  return result;
};

const create = async (redis) => {
  const provider = getDefaultProvider(config.get("ethereum.endpoint"));
  const address = config.get("contracts.sw3");
  const contract = new Contract(address, sw3Abi, provider);

  // Filter
  const filter = contract.filters.SimpleSwapDeployed();

  // Handle race conditions between fetch and events
  const queue = [];
  let upToDate = true;

  const getIssuer = (address) => {
    const contract = new Contract(address, ssAbi, provider);
    return contract.issuer();
  };

  // Update Redis to tell that the node was deployed
  const setDeployed = async (blockNumber, { contractAddress }) => {
    // Set the latest block
    redis.set(DEPLOYED_KEY, blockNumber);

    // Fetch the contracts issuer
    const issuer = utils.getAddress(await getIssuer(contractAddress));

    // Fetch users that sprinkled that address
    const usersKey = `sprinkles:address:${issuer}`;
    const users = await redis.smembers(usersKey);
    await users.map((user) => redis.sadd(deployedKey(user), issuer));
    await redis.del(usersKey);
  };

  const handleEvent = (event) => {
    return setDeployed(event.blockNumber, cleanOutput(event.args));
  };

  const fetchEvents = async () => {
    // Fetch the highest block in redis
    const blockNumber =
      parseInt(await redis.get(DEPLOYED_KEY)) ||
      config.get("faucet.launchBlockHeight");
    const events = await contract.queryFilter(filter, blockNumber);

    // Handle in order so that we can't miss any in case of errors
    for (const event of events) {
      await handleEvent(event);
    }

    // Empty the event queue
    let event;
    while ((event = queue.shift())) {
      await handleEvent(event);
    }

    // Let the next elements be processed immediately
    upToDate = true;
  };

  const syncEvents = () => {
    contract.on(filter, (_, event) =>
      upToDate ? handleEvent(event) : queue.push(event)
    );
  };

  const start = () => {
    syncEvents();
    fetchEvents();
  };

  return {
    start,
  };
};

module.exports = {
  create,
};
