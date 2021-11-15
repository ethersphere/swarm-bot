const config = require("config");
const { providers } = require("ethers");
const Web3WsProvider = require("web3-providers-ws");

const getDuplicates = (array) => {
  const sorted = [...array].sort();
  const results = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] == sorted[i]) {
      results.push(sorted[i]);
    }
  }

  return results;
};

const promiseProgress = (promises, progress) => {
  let done = -1;
  const notify = () => progress({ done: ++done, total: promises.length });
  notify();
  return Promise.all(promises.map((promise) => promise.then(notify)));
};

const getProvider = () => {
  return new providers.Web3Provider(
    new Web3WsProvider(
      config.get("ethereum.endpoint"),
      config.get("ethereum.providerOptions")
    )
  );
};

module.exports = {
  getDuplicates,
  promiseProgress,
  getProvider,
};
