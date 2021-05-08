const config = require("config");
const { Client, Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILD, Intents.FLAGS.GUILD_MESSAGES],
});

// Requires bot and applications.commands
const commands = {
  faucet: require("./commands/faucet"),
};

// Requires Manage Messages
const messages = [require("./messages/sprinkle")];

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  // const app = client.application
  const app = client.guilds.cache.get("840525910624960512");

  // Delete old commands
  const oldCommands = await app.commands.fetch();
  await Promise.all(
    [...oldCommands.keys()].map((id) => app.commands.delete(id))
  );

  // Add new commands
  await Object.values(commands).map((command) =>
    app.commands.create(command.CONFIG)
  );

  console.log(`Commands set up`);
});

client.on("interaction", (interaction) => {
  if (!interaction.isCommand()) {
    return;
  }

  const command = commands[interaction.commandName];
  if (!command) {
    return;
  }

  command.execute(interaction);
});

client.on("message", (message) => {
  for (const { execute } of messages) {
    execute(message);
  }
});

client.login(config.get("bot.token"));
