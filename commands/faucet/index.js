const config = require("config");
const { formatDistanceToNow } = require("date-fns");
const {
  getDefaultProvider,
  utils,
  BigNumber,
  Wallet,
  Contract,
} = require("ethers");
const { NonceManager } = require("@ethersproject/experimental");
const abi = require("./abi.json");

// Lib
const { execute } = require("../lib");
const { getUserId, getPermissions } = require("../../lib/permissions");
const { getDuplicates, promiseProgress } = require("../../lib/tools");

// Ethers setup
const provider = getDefaultProvider(config.get("ethereum.endpoint"));
const signer = new Wallet(config.get("ethereum.privateKey"), provider);
const wallet = new NonceManager(signer);
const gbzz = new Contract(config.get("contracts.gbzz"), abi, wallet);

// Command
const CONFIG = {
  name: "faucet",
  description: "Interact with the testnet faucet",
  options: [
    {
      name: "sprinkle",
      description: "Funds your test nodes with gBZZ and gETH",
      type: "SUB_COMMAND",
      options: [
        {
          name: "addresses",
          type: "STRING",
          description: "The space-separated Ethereum addresses of your nodes",
          required: true,
        },
      ],
    },
    {
      name: "allowance",
      description: "Returns the maximal number of pending sprinkles",
      type: "SUB_COMMAND",
    },
    {
      name: "remaining",
      description: "Returns the number of available sprinkles",
      type: "SUB_COMMAND",
    },
    {
      name: "pending",
      description:
        "Lists nodes that you have sprinkled but have not been deployed yet",
      type: "SUB_COMMAND",
    },
  ],
};

// Redis keys
const sprinklesKey = (message) => `user:${getUserId(message)}:sprinkles`;
const deployedKey = (message) => `user:${getUserId(message)}:deployed`;

// Functions
const getPending = async (interaction, { redis }) => {
  return await redis.sdiff(sprinklesKey(interaction), deployedKey(interaction));
};

const getAllowance = async (interaction) => {
  const permissions = await getPermissions(interaction);
  return Math.max(...permissions.map(({ sprinkles }) => sprinkles));
};

const getRemaining = async (interaction, { redis }) => {
  const allowance = await getAllowance(interaction, { redis });
  const pending = await getPending(interaction, { redis });
  return allowance - pending.length;
};

const decorate = (interaction) => {
  // Get faucet channel
  const channel = interaction.guild.channels.cache.get(
    config.get("faucet.channel")
  );

  // Get current user
  const user = interaction.user.toString();

  // Some state
  const date = new Date();
  let previous;

  // Overwrite the ephemeral function
  interaction._ephemeral = interaction.ephemeral;
  interaction.ephemeral = async (message, { keep = false, timing } = {}) => {
    // Remove the previous message and only keep the last one
    previous && previous.then((message) => message.delete());
    const msg = channel.send(
      [
        user,
        message,
        timing && `(${formatDistanceToNow(date, { includeSeconds: true })})`,
      ]
        .filter(Boolean)
        .join(" ")
    );
    previous = !keep && msg;

    // Forward to the original function
    return interaction._ephemeral(message);
  };
};

// Commands
const pending = async (interaction, _, { redis }) => {
  const pending = await getPending(interaction, { redis });
  interaction.ephemeral(
    pending.length
      ? `The following address${
          pending.length > 1 ? "es are" : " is"
        } still pending: ${pending.join(" ")}`
      : "You don't have any pending deploys! :grin: :bee:"
  );
};

const allowance = async (interaction) => {
  const allowance = await getAllowance(interaction);
  interaction.ephemeral(`You can have ${allowance} pending sprinkles at most`);
};

const remaining = async (interaction, _, { redis }) => {
  const remaining = await getRemaining(interaction, { redis });
  interaction.ephemeral(
    remaining
      ? `You have ${remaining} sprinkle${remaining === 1 ? "" : "s"} left.`
      : "You do not have any sprinkles left. Deploy sprinkled nodes to get sprinkles back."
  );
};

const sprinkle = async (interaction, options, { redis }) => {
  // Validate addresses
  const addresses = options[0].value.split(/[ ,;]/).map((address) => {
    try {
      return utils.getAddress(address);
    } catch (err) {
      return address;
    }
  });
  const invalid = addresses.flatMap((address) =>
    !utils.isAddress(address) ? address : []
  );

  if (invalid.length) {
    interaction.ephemeral(
      `The following address${
        invalid.length > 1 ? "es are" : " is"
      } invalid: ${invalid.join(" ")}`
    );
    return;
  }

  // Check if there are no duplicates
  const duplicates = getDuplicates(addresses);
  if (duplicates.length) {
    interaction.ephemeral(
      `Duplicated address${
        duplicates.length > 1 ? "es" : ""
      } found: ${duplicates.join(" ")}`
    );
    return;
  }

  // Check if the user has enough sprinkles left
  const remaining = await getRemaining(interaction, { redis });
  if (addresses.length > remaining) {
    interaction.ephemeral(
      remaining
        ? `You can only sprinkle ${remaining} more addresses.`
        : "You don't have any sprinkles left."
    );
    return;
  }

  // Check if the address was already sprinkled
  const isMember = await redis.smismember("sprinkles", ...addresses);
  const sprinkled = isMember.flatMap((isMember, index) =>
    isMember ? addresses[index] : []
  );
  if (sprinkled.length) {
    interaction.ephemeral(
      `The following address${
        sprinkled.length > 1 ? "es were" : " was"
      } already sprinkled: ${sprinkled.join(" ")}`
    );
    return;
  }

  // Lock the sprinkled addresses
  redis.sadd("sprinkles", ...addresses);
  redis.sadd(sprinklesKey(interaction), ...addresses);

  try {
    console.log(`Funding ${addresses.join(" ")}`);
    interaction.ephemeral(
      `Funding ${
        addresses.length > 1 ? `${addresses.length} addresses` : addresses[0]
      }...`,
      { keep: true }
    );

    // Amounts
    const gbzzAmount = BigNumber.from(config.get("faucet.sprinkle.gbzz"));
    const ethAmount = BigNumber.from(config.get("faucet.sprinkle.eth"));

    // Send
    // TODO: Only send missing amount
    const transactions = await Promise.all(
      addresses.flatMap((to) => [
        gbzz.transfer(to, gbzzAmount),
        wallet.sendTransaction({ to, value: ethAmount }),
      ])
    );

    // Wait
    await promiseProgress(
      transactions.map((tx) => tx.wait()),
      ({ done, total }) => {
        interaction.ephemeral(
          `Waiting for confirmations (${done}/${total})...`,
          { timing: done > 0 }
        );
      }
    );
    interaction.ephemeral(
      `Node${addresses.length > 1 ? "s" : ""} funded! :bee:`,
      { timing: true }
    );

    // Add sprinkled addresses to Redis
    addresses.map((address) =>
      redis.sadd(`sprinkles:address:${address}`, getUserId(interaction))
    );
  } catch (err) {
    // Unlock the sprinkled addresses
    // TODO: Only unlock failed ones
    redis.srem("sprinkles", ...addresses);
    redis.srem(sprinklesKey(interaction), ...addresses);
    throw err;
  }
};

const commands = { sprinkle, remaining, allowance, pending };
module.exports = {
  CONFIG,
  execute: execute.bind(null, commands, { decorate }),
};
