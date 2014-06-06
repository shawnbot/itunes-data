module.exports.ascending = function ascending(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};

module.exports.descending = function descending(a, b) {
  return a < b ? 1 : a > b ? -1 : 0;
};
