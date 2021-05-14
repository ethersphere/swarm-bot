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

const getOption = (options, name) => {
  for (const option of options) {
    if (option.name === name) {
      return option;
    }
  }
};

module.exports = {
  getDuplicates,
  promiseProgress,
  getOption,
};
