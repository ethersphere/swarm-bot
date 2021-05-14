// Execute sub-commands
const execute = async (
  commands,
  { decorate, allowed } = {},
  interaction,
  dependencies
) => {
  let sent = false;

  interaction.ephemeral = async (message) => {
    const fn = sent ? interaction.editReply : interaction.reply;
    sent = true;

    return fn.bind(interaction)(message, { ephemeral: true });
  };

  // Decrate the interaction
  if (decorate) {
    await decorate(interaction);
  }

  if (allowed && !(await allowed(interaction))) {
    interaction.ephemeral(
      `You're not allowed to run this command... :rotating_light:`
    );
    return;
  }

  for (const { name, type, options } of interaction.options) {
    if (type === "SUB_COMMAND") {
      try {
        await commands[name](interaction, options, dependencies);
      } catch (err) {
        console.error(err);
        interaction.ephemeral(`An error occurred... :slight_frown:`);
      }
    }
  }
};

module.exports = {
  execute,
};
