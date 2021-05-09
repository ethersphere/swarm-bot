const config = require("config");

const getUserId = (interaction) => interaction.member.user.id;

const getPermissions = async (interaction) => {
  // Fetch server roles (required for the next line)
  await interaction.guild.roles.fetch();

  // Fetch user roles
  const roles = [...(await interaction.member.roles.cache.values())];
  const ids = roles.map(({ id }) => id);
  const names = roles.map(({ name }) => name);

  // Return all permissions that match the user's roles
  return config
    .get("permissions")
    .filter(
      (permission) =>
        permission.names.some((name) => names.includes(name)) ||
        permission.ids.some((id) => ids.includes(id))
    );
};

module.exports = {
  getUserId,
  getPermissions,
};
