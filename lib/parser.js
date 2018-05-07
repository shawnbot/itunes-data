var expat = require("node-expat");

module.exports = function() {
  var parser = new expat.Parser("utf-8"),
      current = parser.data = {},
      element,
      key = "library",
      stack = [],
      value,
      depth = 0,
      parse = identity,
      parsers = {
        "integer": parseInt,
        "date": function(str) {
          return new Date(str);
        }
      };

  parser.on("startElement", function(name, attrs) {
    // console.warn("+", name);
    var parent = current;
    element = name;
    switch (name) {
      case "key":
        key = "";
      case "plist":
        current.version = attrs.version;
        break;
      case "dict":
        depth = stack.push(current);
        current = current[key] = {key: key};
        break;
      case "array":
        depth = stack.push(current);
        current = current[key] = [];
        current.key = key;
        break;
      case "true":
      case "false":
        value = (name === "true");
        break;
      default:
        parse = parsers[name] || identity;
    }

    if (current !== parent && Array.isArray(parent)) {
      parent.push(current);
    }
    value = "";
  });

  parser.on("text", function(text) {
    if (element === "key") {
      key += text;
    }
    var val = parse(text);
    if (typeof val === "string") {
      value += val;
    } else {
      value = val;
    }
  });

  /*
  parser.on("entityDecl", function(name, isParameter, value) {
    console.error("entity:", name, isParameter, value);
  });

  parser.on("processingInstruction", function(target, data) {
    console.error("processingInstruction:", target, data);
  });
  */

  parser.on("endElement", function(name) {
    // console.warn("-", name);
    element = null;
    switch (name) {
      // don't do anything with the key
      case "key": break;

      case "array":
      case "dict":
        var child = current;
        current = stack.pop();
        depth = stack.length;

        delete child.key;
        switch (current.key) {
          case "library":
            parser.emit("library", current);
            break;
          case "Tracks":
            parser.emit("track", child);
            break;
          case "Playlists":
            if (child.Name) {
              parser.emit("playlist", child);
            }
            break;
        }
        key = null;
        break;

      default:
        if (key && current) {
          current[key] = value;
          // console.warn(repeat(". ", depth), key, "=", value);
        }
    }
  });

  return parser;
};

function repeat(str, len) {
  var out = [];
  for (var i = 0; i < len; i++) out.push(str);
  return out.join("");
}

function identity(d) {
  return d;
}
