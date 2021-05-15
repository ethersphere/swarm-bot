// Lib
const { execute } = require("../lib");
const { getPermissions } = require("../../lib/permissions");

// Messages
const { load } = require("../../messages/cleaner");

// Config
const REDIS_KEY = "cleaner:regexes";
const CONFIG = {
  name: "cleaner",
  description: "Interact with the cleaner... :broom:",
  options: [
    {
      name: "add",
      description: "Add a regex of messages to remove",
      type: "SUB_COMMAND",
      options: [
        {
          name: "regex",
          type: "STRING",
          description: "Regex that matches messages to delete",
          required: true,
        },
      ],
    },
    {
      name: "remove",
      description: "Remove a regex of messages to remove",
      type: "SUB_COMMAND",
      options: [
        {
          name: "regex",
          type: "STRING",
          description: "Regex that matches messages to delete",
          required: true,
        },
      ],
    },
    {
      name: "list",
      description: "Lists regexes used by the cleaner",
      type: "SUB_COMMAND",
    },
  ],
};

// Functions
const allowed = async (interaction) => {
  const permissions = await getPermissions(interaction);
  return permissions.some(({ cleaner }) => cleaner);
};

// Commands
const add = async (interaction, options, { redis }) => {
  const regex = options[0].value;
  const added = await redis.sadd(REDIS_KEY, regex);
  interaction.ephemeral(added ? "Regex added" : "Regex already existed");

  if (added) {
    await load({ redis });
  }
};

const remove = async (interaction, options, { redis }) => {
  const regex = options[0].value;
  const removed = await redis.srem(REDIS_KEY, regex);
  interaction.ephemeral(removed ? "Regex removed" : "Regex doesn't exist");

  if (removed) {
    await load({ redis });
  }
};

const list = async (interaction, _, { redis }) => {
  const regexes = await redis.smembers(REDIS_KEY);
  interaction.ephemeral(
    "Regexes:\n" + regexes.map((regex) => `- ${regex}`).join("\n")
  );
};

const commands = { add, remove, list };
module.exports = {
  CONFIG,
  execute: execute.bind(null, commands, { allowed }),
};
