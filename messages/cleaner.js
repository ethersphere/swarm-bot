const RegexParser = require("regex-parser");

// Cache
let regexes;

// Config
const REDIS_KEY = "cleaner:regexes";

// This is a bit disgusting. Would probably be better to set
// notifications up: https://redis.io/topics/notifications
const load = async ({ redis }) => {
  regexes = (await redis.smembers(REDIS_KEY)).map(RegexParser);
};

const execute = async (message, { redis }) => {
  if (!message.guild) {
    return;
  }

  if (!regexes) {
    await load({ redis });
  }

  if (regexes.some((regex) => regex.test(message.content))) {
    message.delete();
  }
};

module.exports = {
  execute,
  load,
};
