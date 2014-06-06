# itunes-data

Export your iTunes library in easy-to-read formats! Install with npm:

```
$ npm install itunes-data
```

## Node usage
The module's `parser()` function returns an streaming XML parser that emits
events for different types of data that it encounters in Apple's XML-based
[property list](http://en.wikipedia.org/wiki/Property_list) files:

* `track` emits a track (song) object with fields such as `Name`, `Artist`, `Album`, `Genre`, and so on.
* `artist` emits an artist object with fields such as `Name`, `Track Count`, and `Play Count`.
* `album` emits an album object with fields such as `Artist`, `Album Artist`, `Track Count`, and so on.
* `playlist` emits a playlist album with fields such as `Name`, `Tracks` (an array of track objects), and so on.
* `library` emits a big, nested object of your entire library.

```js
var fs = require("fs"),
    itunes = require("itunes-data"),
    parser = itunes.parser(),
    stream = fs.createReadStream("path/to/iTunes Media Library.xml");

parser.on("track", function(track) {
    console.log("track:", track);
});

parser.on("album", function(album) {
    console.log("album:", track);
});

stream.pipe(parser);
```

## Command Line
Or install the command-line utility:

```
$ npm install -g itunes-data
$ itunes-data --help
Export an iTunes libray XML file.

Usage: itunes-data [options] [path/to/library.xml]

Options:
  --tracks     Save tracks (songs) to this file
  --playlists  Save playlists to this file
  --artists    Save artists to this file
  --albums     Save albums to this file
  --library    Save the library to this (JSON) file
  --format     Default output file format ('csv', 'tsv', 'json' or 'ldjson')  [default: "csv"]
```

### Examples
Export a all tracks (songs) in your library as comma-separated values (CSV):

```sh
$ itunes-data --tracks tracks.csv ~/Music/iTunes/iTunes\ Media\ Library.xml
```

Export a all albums in your library as tab-separated values:

```sh
$ itunes-data --albums albums.tsv ~/Music/iTunes/iTunes\ Media\ Library.xml
```

Export your entire library as JSON:

```sh
$ itunes-data --library library.json ~/Music/iTunes/iTunes\ Media\ Library.xml
```

If you leave off the filename for any of the `--artists`, `--tracks`,
`--playlists`, `--albums` or `--library` list options the data will be written
to stdout, in which case you probably want to specify the `--format` option as
well. You should only use *one* of the list options in this case! 

```sh
$ itunes-data --artists --format json \
    ~/Music/iTunes/iTunes\ Media\ Library.xml > artists.json
```
