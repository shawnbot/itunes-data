var sort = {};

sort.by = function(key, cmp) {
  if (key.charAt(0) === "-") {
    cmp = sort.descending;
    key = key.substr(1);
  } else if (key.charAt(0) === "+") {
    cmp = sort.ascending;
    key = key.substr(1);
  }
  if (!cmp) cmp = sort.ascending;
  return function sortBy(a, b) {
    return cmp(a[key], b[key]);
  };
};

sort.ascending = function ascending(a, b) {
  return a > b ? 1 : a < b ? -1 : 0;
};

sort.descending = function descending(a, b) {
  return a < b ? 1 : a > b ? -1 : 0;
};

module.exports = sort;
