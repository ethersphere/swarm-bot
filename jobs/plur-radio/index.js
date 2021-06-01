const config = require("config");

const create = async ({ discord }) => {
  let connection, dispatcher;
  const guild = discord.guilds.cache.get(config.get("server"));
  const channel = guild.channels.cache.get(config.get("plurRadio.channel"));

  const start = async () => {
    connection = await channel.join();
    await channel.setTopic("PLUR Radio");
    await guild.me.voice.setSuppressed(false);
    dispatcher = connection.play("http://plur.buzz:8000/radio.mp3");
  };

  const stop = async () => {
    dispatcher.destroy();
    await guild.me.voice.setSuppressed(true);
    await channel.setTopic();
    connection.disconnect();
    channel.leave();
  };

  return {
    start,
    stop,
  };
};

module.exports = {
  create,
};
