const execute = async (message) => {
  if (!message.guild || !message.content.startsWith("faucet")) {
    return;
  }

  message.delete();
};

module.exports = {
  execute,
};
