// run this script with electron-spawn:
// $ electron-spawn resizer.js add cactus.jpg

var hyperdrive = require('hyperdrive')
var fs = require('fs')
var path = require('path')
var sub = require('subleveldown')
var to = require('to2')
var concat = require('concat-stream')
var once = require('once')
var filereader = require('filereader-stream')
var jpeg = require('../')

var level = require('level')
var db = level('/tmp/photos.db')

var namedArchives = require('hyperdrive-named-archives')
var named = namedArchives({
  drive: hyperdrive(sub(db, 'drive')),
  db: sub(db, 'archives')
})
var archive = named.createArchive('photos')
var thumbs = named.createArchive('thumbs')

var photos = jpeg({
  archive: archive,
  db: sub(db, 'jpeg'),
  properties: {
    time: ['EXIF','exif','DateTimeOriginal',isoString],
    orientation: ['EXIF','image','Orientation'],
    width: ['SOF','width'],
    height: ['SOF','height']
  },
  map: function (entry, stream, next) {
    next = once(next)
    stream.pipe(concat(function (body) {
      var img = new Image
      img.addEventListener('load', function () {
        var canvas = resize(img, 300)
        canvas.toBlob(function (blob) {
          var r = new FileReader
          filereader(r)
            .pipe(thumbs.createFileWriteStream(entry.name))
            .once('error', next)
            .once('finish', next)
          r.readAsArrayBuffer(blob)
        }, 'image/jpeg')
      })
      img.src = 'data:image/jpeg;base64,' + body.toString('base64')
    }))
  }
})
function isoString (date) { return date.toISOString() }

function resize (img, maxDim) {
  var aspect = img.width / img.height
  if (img.width > img.height) {
    img.width = maxDim
    img.height = Math.round(maxDim * aspect)
  } else {
    img.width = Math.round(maxDim / aspect)
    img.height = maxDim
  }
  var canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);
  return canvas
}

if (process.argv[2] === 'add') {
  var file = process.argv[3]
  fs.createReadStream(file)
    .pipe(archive.createFileWriteStream(path.basename(file)))
} else if (process.argv[2] === 'list') {
  photos.list().pipe(to.obj(function (img, enc, next) {
    console.log(img)
  }))
} else if (process.argv[2] === 'thumb') {
  var file = process.argv[3]
  thumbs.createFileReadStream(file).pipe(process.stdout)
}
