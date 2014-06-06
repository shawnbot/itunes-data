var fs = require("fs"),
    csv = require("fast-csv"),
    json = require("JSONStream"),
    ldjson = require("ldjson-stream"),
    util = require("util");

var writersByType = {
  // comma-separated values
  "csv": function() {
    return csv.createWriteStream({
      headers: true,
      delimiter: ",",
      quote: '"'
    });
  },
  // tab-separated values
  "tsv": function() {
    return csv.createWriteStream({
      headers: true,
      delimiter: "\t",
      quote: ""
    });
  },
  // JSON array
  "json": function() {
    return json.stringify();
  },
  // line-delimited JSON
  "ldjson": function() {
    return ldjson.serialize();
  }
};

writersByType.ldj = writersByType.ldjson;

module.exports.createWriteStream = function(type) {
  if (!writersByType.hasOwnProperty(type)) {
    throw "Unrecognized stream type: " + type;
  }
  return writersByType[type]();
};
