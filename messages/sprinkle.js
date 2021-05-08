const execute = async (message) => {
  if (!message.guild || !message.content.startsWith("sprinkle")) {
    return;
  }

  message.delete();
};

module.exports = {
  execute,
};
