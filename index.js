const config = require("config");
const Redis = require("ioredis");
const redis = new Redis(config.get("redis"));

if (!config.get("server")) {
  console.error("Please configure a server");
  process.exit(-1);
}

// Discord.js
const { Client, Intents } = require("discord.js");
const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
});

// Background jobs
const deployed = require("./jobs/deployed");

// Requires bot and applications.commands
const commands = {
  faucet: require("./commands/faucet"),
  cleaner: require("./commands/cleaner"),
};

// Requires Manage Messages
const messages = [require("./messages/cleaner")];

client.on("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const app = client.guilds.cache.get(config.get("server"));

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
  if (
    !interaction.isCommand() ||
    interaction.guildID !== config.get("server")
  ) {
    return;
  }

  const command = commands[interaction.commandName];
  if (!command) {
    return;
  }

  command.execute(interaction, { redis });
});

client.on("message", (message) => {
  for (const { execute } of messages) {
    execute(message, { redis });
  }
});

// Log into the bot
client.login(config.get("bot.token"));

// Start background jobs
const jobs = {};

(async () => {
  jobs.deployed = await deployed.create(redis);
  jobs.deployed.start();
})();
