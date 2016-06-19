var test = require('tape')
var hyperdrive = require('hyperdrive')
var fs = require('fs')
var path = require('path')
var memdb = require('memdb')
var to = require('to2')
var collect = require('collect-stream')
var jpeg = require('../')

test('map set prop', function (t) {
  t.plan(5)
  var drive = hyperdrive(memdb())
  var archive = drive.createArchive({ live: true })
  var photos = jpeg({
    archive: archive,
    db: memdb(),
    properties: {
      width: ['SOF','width'],
      height: ['SOF','height']
    },
    map: function (entry, stream, next) {
      // hyperdrive already keeps the size, only useful for testing map
      var size = 0
      stream.pipe(to(write, end))
      function write (buf, enc, next) {
        size += buf.length
        next()
      }
      function end () {
        next(null, { size: size })
      }
    }
  })
  var file = path.join(__dirname, 'files/cactus.jpg')
  fs.createReadStream(file)
    .pipe(archive.createFileWriteStream('cactus.jpg'))
    .once('finish', onfinish)
  function onfinish () {
    collect(photos.list(), function (err, docs) {
      t.error(err)
      t.deepEqual(docs.map(fname), ['cactus.jpg'], 'photo name')
      t.deepEqual(docs.map(fprops), [
        {
          size: 32378,
          width: 150,
          height: 200
        }
      ], 'photo properties')
    })
    photos.get('cactus.jpg', function (err, doc) {
      t.error(err)
      t.deepEqual(doc, {
        size: 32378,
        width: 150,
        height: 200
      }, 'get property')
    })
  }
})

function isoString (date) { return date.toISOString() }
function fname (doc) { return doc.name }
function fprops (doc) { return doc.properties }
