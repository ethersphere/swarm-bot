const { getPermissions } = require("../lib/permissions");

const regexes = [
  // Japanese
  /[\u3000-\u303f]|[\u3040-\u309f]|[\u30a0-\u30ff]|[\uff00-\uff9f]|[\u4e00-\u9faf]|[\u3400-\u4dbf]/,

  // Chinese
  /[\u4e00-\u9fff]|[\u3400-\u4dbf]|[\u{20000}-\u{2a6df}]|[\u{2a700}-\u{2b73f}]|[\u{2b740}-\u{2b81f}]|[\u{2b820}-\u{2ceaf}]|[\uf900-\ufaff]|[\u3300-\u33ff]|[\ufe30-\ufe4f]|[\uf900-\ufaff]|[\u{2f800}-\u{2fa1f}]/u,

  // Cyrillic
  /\p{Script=Cyrillic}/u,
];

const allowed = async (message) => {
  const permissions = await getPermissions(message);
  return permissions.some(({ foreignLanguages }) => foreignLanguages);
};

const execute = async (message) => {
  if (!message.guild || (await allowed(message))) {
    return;
  }

  if (regexes.some((regex) => regex.test(message.content))) {
    message.delete();
  }
};

module.exports = {
  execute,
};
