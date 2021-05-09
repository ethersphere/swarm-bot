const config = require("config");
const { providers, utils, BigNumber, Wallet, Contract } = require("ethers");
const { NonceManager } = require("@ethersproject/experimental");
const abi = require("./abi.json");

// Ethers setup
const provider = new providers.JsonRpcProvider(config.get("ethereum.endpoint"));
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
  ],
};

// Commands
const sprinkle = async (interaction, options) => {
  const addresses = options[0].value.split(/[ ,;]/);

  // Validate addresses
  const invalid = addresses
    .map((address) => !utils.isAddress(address) && address)
    .filter(Boolean);

  if (invalid.length) {
    interaction.ephemeral(
      `The following address${
        invalid.length > 1 ? "es are" : " is"
      } invalid: ${invalid.join(" ")}`
    );
    return;
  }

  interaction.ephemeral(
    `Funding ${
      addresses.length > 1 ? `${addresses.length} addresses` : addresses[0]
    }...`
  );

  // Amounts
  const gbzzAmount = BigNumber.from(config.get("faucet.fund.gbzz"));
  const ethAmount = BigNumber.from(config.get("faucet.fund.eth"));

  // Send
  const transactions = await Promise.all(
    addresses.flatMap((to) => [
      gbzz.transfer(to, gbzzAmount),
      wallet.sendTransaction({ to, value: ethAmount }),
    ])
  );
  interaction.ephemeral(`Waiting for confirmation...`);

  // Wait
  await transactions.map((tx) => tx.wait());
  interaction.ephemeral(`Node${addresses.length > 1 ? "s" : ""} funded! :bee:`);
};

// Execute sub-commands
const commands = { sprinkle };
const execute = async (interaction) => {
  let sent = false;
  interaction.ephemeral = (message) => {
    const fn = sent ? interaction.editReply : interaction.reply;
    sent = true;
    return fn.bind(interaction)(message, { ephemeral: true });
  };

  for (const { name, type, options } of interaction.options) {
    if (type === "SUB_COMMAND") {
      try {
        await commands[name](interaction, options);
      } catch (err) {
        console.error(err);
        interaction.ephemeral(`An error occurred... :slight_frown:`);
      }
    }
  }
};

module.exports = {
  CONFIG,
  execute,
};
