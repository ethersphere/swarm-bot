const config = require("config");
const { providers, BigNumber, Wallet, Contract } = require("ethers");
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
      name: "fund",
      description: "Funds your test node with gBZZ and gETH",
      type: "SUB_COMMAND",
      options: [
        {
          name: "address",
          type: "STRING",
          description: "The Ethereum address of your node",
          required: true,
        },
      ],
    },
  ],
};

const fund = async (interaction, options) => {
  const to = options[0].value;
  interaction.ephemeral(`Funding ${to}...`);

  // Amounts
  const gbzzAmount = BigNumber.from(config.get("faucet.fund.gbzz"));
  const ethAmount = BigNumber.from(config.get("faucet.fund.eth"));

  // Send
  const transactions = await Promise.all([
    gbzz.transfer(to, gbzzAmount),
    wallet.sendTransaction({ to, value: ethAmount }),
  ]);
  interaction.ephemeral(`Waiting for confirmation...`);

  // Wait
  await transactions.map((tx) => tx.wait());
  interaction.ephemeral(`Node funded! :bee:`);
};

// Execute sub-commands
const commands = { fund };
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
