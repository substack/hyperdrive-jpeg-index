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

  var propmap = {}
  Object.keys(opts.properties || {}).forEach(function (key) {
    var p = opts.properties[key]
    var type = p[0]
    if (!propmap[type]) propmap[type] = []
    propmap[type].push([key,p.slice(1)])
  })

  self.dex = hdex({
    archive: self.archive,
    db: sub(opts.db, DEX),
    map: function (entry, next) {
      if (!/\.jpe?g/i.test(entry.name)) return next()
      var stream = self.archive.createFileReadStream(entry)
      stream.pipe(jpeg()).pipe(to.obj(write, end))
      stream.once('error', next)

      function write (marker, enc, next) {
        var props = propmap[marker.type] || []
        props.forEach(function (p) {
          var n = get(marker, p[1])
          console.log(p[0], '=>', n)
        })
        next()
      }
      function end () {}
    }
  })
}

function get (obj, keys) {
  var node = obj
  for (var i = 0; i < keys.length; i++) {
    if (!node) break
    var key = keys[i]
    if (typeof key === 'function') {
      node = key(node)
    } else node = node[key]
  }
  return node
}
