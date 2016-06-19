var hyperdrive = require('hyperdrive')
var fs = require('fs')
var path = require('path')
var sub = require('subleveldown')
var to = require('to2')
var jpeg = require('../')

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
    time: ['EXIF','exif','DateTimeOriginal'],
    orientation: ['EXIF','image','Orientation'],
    width: ['SOF','width'],
    height: ['SOF','height']
  }
})

if (process.argv[2] === 'add') {
  var file = process.argv[3]
  fs.createReadStream(file)
    .pipe(archive.createFileWriteStream(path.basename(file)))
} else if (process.argv[2] === 'list') {
  photos.list().pipe(to.obj(function (img, enc, next) {
    console.log(img)
  }))
} else if (process.argv[2] === 'info') {
  var file = process.argv[3]
  photos.get(file, function (err, info) {
    if (err) console.error(err)
    else console.log(info)
  })
}