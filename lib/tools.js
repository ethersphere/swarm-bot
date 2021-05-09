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

module.exports = {
  getDuplicates,
};
