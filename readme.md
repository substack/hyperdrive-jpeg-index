# hyperdrive-jpeg-index

index jpeg metadata (such as SOF, EXIF fields)
and create thumbnails for a [hyperdrive][1] archive

# example

This example will store `time` and `orientation` values from EXIF headers and
`width` and `height` values from SOF headers.

``` js
var hyperdrive = require('hyperdrive')
var fs = require('fs')
var path = require('path')
var sub = require('subleveldown')
var to = require('to2')
var jpeg = require('hyperdrive-jpeg-index')

var level = require('level')
var db = level('/tmp/photos.db')

var namedArchives = require('hyperdrive-named-archives')
var named = namedArchives({
  drive: hyperdrive(sub(db, 'drive')),
  db: sub(db, 'archives')
})
var archive = named.createArchive('photos')
var photos = jpeg({
  archive: archive,
  db: sub(db, 'jpeg'),
  properties: {
    time: ['EXIF','exif','DateTimeOriginal',isoString],
    orientation: ['EXIF','image','Orientation'],
    width: ['SOF','width'],
    height: ['SOF','height']
  }
})
function isoString (date) { return date.toISOString() }

if (process.argv[2] === 'add') {
  var file = process.argv[3]
  fs.createReadStream(file)
    .pipe(archive.createFileWriteStream(path.basename(file)))
} else if (process.argv[2] === 'list') {
  photos.list().pipe(to.obj(function (img, enc, next) {
    console.log(img)
  }))
}
```

output:

```
$ node photos.js add cactus.jpg
$ node photos.js list
{ name: 'cactus.jpg',
  properties: 
   { time: '2015-06-19T16:40:52.000Z',
     orientation: 1,
     width: 600,
     height: 800 } }
```

# api

```
var jpeg = require('hyperdrive-jpeg-index')
```

## var photos = jpeg(opts)

Create a `photos` instance from:

* `opts.archive` - a [hyperdrive][1] archive
* `opts.db` - a leveldb instance to save index data
* `opts.properties` - map of property keys to marker key paths

Each marker key path given in `opts.properties` is an array that describes the
nested location into a [marker object][2] to produce a value. Key path items can
be a string or a `function (node) {}` that take an object as input and should
return the next node value to use in the traversal.

## var stream = photos.list()

Return a readable objectMode `stream` of records. Each record has:

* `row.name` - file name from hyperdrive
* `row.properties` - the values generated from the marker key paths

## photos.get(name, cb)

Fetch the property values generated for a file `name`.

# install

```
npm install hyperdrive-jpeg-index
```

# license

BSD

[1]: https://npmjs.com/package/hyperdrive
[2]: https://npmjs.com/package/jpeg-marker-stream
