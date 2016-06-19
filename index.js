var hdex = require('hyperdrive-index')
var jpeg = require('jpeg-marker-stream')
var sub = require('subleveldown')
var to = require('to2')

var DEX = 'd', META = 'm'

module.exports = JDEX

function JDEX (opts) {
  var self = this
  if (!(self instanceof JDEX)) return new JDEX(opts)
  self.metadb = sub(opts.db, META)
  self.archive = opts.archive
  self.dex = hdex({
    archive: self.archive,
    db: sub(opts.db, DEX),
    map: function (entry, next) {
      if (!/\.jpe?g/i.test(entry.name)) return next()
      var stream = self.archive.createFileReadStream(entry)
      stream.pipe(jpeg()).pipe(to.obj(write, end))
      stream.once('error', next)

      function write (marker, enc, next) {
        if (marker.type === 'EXIF') {
          //console.log('marker=', marker)
        }
        console.log(marker)
        next()
      }
      function end () {}
    }
  })
}

JDEX.prototype.put = function (x) {
}
