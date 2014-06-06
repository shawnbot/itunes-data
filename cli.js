#!/usr/bin/env node
var fs = require("fs"),
    Parser = require("./lib/parser"),
    writer = require("./lib/writer"),
    sort = require("./lib/sort"),
    optimist = require("optimist")
      .usage("Export an iTunes libray XML file.\n\nUsage: $0 [options] [path/to/library.xml]")
        .describe("tracks", "Save tracks (songs) to this file")
        .alias("t", "tracks")
        .alias("songs", "tracks")
      .describe("playlists", "Save playlists to this file")
        .alias("p", "playlists")
      .describe("artists", "Save artists to this file")
        .alias("a", "artists")
      .describe("albums", "Save albums to this file")
        .alias("A", "albums")
      .describe("library", "Save the library to this (JSON) file")
        .alias("L", "library")
      .describe("format", "Default output file format ('csv', 'tsv', 'json' or 'ldjson')")
        .default("format", "csv")
        .alias("f", "format"),
    argv = optimist.argv,
    argc = argv._;

if (!argc.length) {
  return optimist.showHelp();
}

var input = argc.length
      ? fs.createReadStream(argc[0])
      : process.stdin,
    streams = [],
    parser = new Parser();

function createWriteStream(file, format) {
  var type = format || argv.format;
  if (file === true) {
    file = "-";
  } else if (!format) {
    type = file.split(".").pop() || argv.format;
  }
  var stream = writer.createWriteStream(type);
  stream.pipe(file === "-"
    ? process.stdout
    : fs.createWriteStream(file));
  streams.push(stream);
  return stream;
}

if (argv.tracks) {
  var tracks = createWriteStream(argv.tracks);
  parser.on("track", function(track) {
    tracks.write(track);
  });
}

if (argv.albums) {
  var albums = createWriteStream(argv.albums),
      albumsByName = {},
      fields = [
        "Artist",
        "Album Artist",
        "Album",
        "Year",
        "Genre",
        "Grouping",
        "Album Rating",
        "Track Count"
      ];

  parser.on("track", function(track) {
    var name = [
      String(track["Album Artist"] || track["Artist"]).trim(),
      track["Album"]
    ].join(" - ");
    var album = albumsByName[name],
        plays = +track["Play Count"] || 0;
    if (!album) {
      album = albumsByName[name] = {};
      fields.forEach(function(field) {
        album[field] = track[field];
      });
      album["Play Count"] = plays;
      album["Track Play Count"] = plays;
    } else {
      album["Play Count"] = Math.min(album["Play Count"], plays);
      album["Track Play Count"] += plays;
    }
  });

  parser.on("end", function() {
    var list = Object.keys(albumsByName)
      .sort(sort.ascending)
      .map(function(name) {
        return albumsByName[name];
      });
    list.forEach(function(album) {
      setImmediate(function() {
        albums.write(album);
      });
    });
  });
}

if (argv.artists) {
  var artists = createWriteStream(argv.artists),
      artistsByName = {};

  parser.on("track", function(track) {
    var name = String(track["Album Artist"] || track["Artist"]).trim(),
        plays = +track["Play Count"] || 0,
        artist = artistsByName[name];
    if (!artist) {
      artist = artistsByName[name] = {
        Name: name,
        "Track Count": 1,
        "Play Count": plays
      };
    } else {
      artist["Track Count"]++;
      artist["Play Count"] += plays;
    }
  });

  parser.on("end", function() {
    var list = Object.keys(artistsByName)
      .sort(sort.ascending)
      .map(function(name) {
        return artistsByName[name];
      });
    // console.log("got %d artists", list.length);
    list.forEach(function(artist) {
      artists.write(artist);
    });
  });
}

if (argv.playlists) {
  var playlists = createWriteStream(argv.playlists),
      tracksById = {},
      ignorePlaylists = [
        "Library",
        "Music",
        "Movies",
        "Podcasts",
        "TV Shows",
        "Audiobooks",
        "Books",
        "Purchased",
        "Apps"
      ];

  parser.on("track", function(track) {
    tracksById[track["Track ID"]] = track;
  });

  parser.on("playlist", function(playlist) {
    if (ignorePlaylists.indexOf(playlist.Name) > 0
        || !playlist["Playlist Items"]) {
      return;
    }
    playlist.Tracks = playlist["Playlist Items"].map(function(track) {
      return tracksById[track["Track ID"]];
    });
    delete playlist["Playlist Items"];
    playlists.write(playlist);
  });
}

if (argv.library) {
  parser.on("library", function(library) {
    // XXX ugggh
    process.stdout.write(JSON.stringify(library));
  });
}

parser.on("end", function done() {
  streams.forEach(function(stream) {
    stream.end();
  });
});

input.pipe(parser);
