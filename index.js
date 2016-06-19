var hdex = require('hyperdrive-index')
var jpeg = require('jpeg-marker-stream')
var sub = require('subleveldown')
var to = require('to2')
var through = require('through2')
var readonly = require('read-only-stream')

var DEX = 'd', META = 'm', PROPS = 'p!'

module.exports = JDEX

function JDEX (opts) {
  var self = this
  if (!(self instanceof JDEX)) return new JDEX(opts)
  self.metadb = sub(opts.db, META, { valueEncoding: 'json' })
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
    map: function (entry, cb) {
      if (!/\.jpe?g$/i.test(entry.name)) return cb()
      var stream = self.archive.createFileReadStream(entry)
      stream.pipe(jpeg()).pipe(to.obj(write, end))
      stream.once('error', cb)
      var value = {}

      function write (marker, enc, next) {
        var props = propmap[marker.type] || []
        props.forEach(function (p) {
          var n = get(marker, p[1])
          if (n) value[p[0]] = n
        })
        next()
      }
      function end () {
        self.metadb.put(PROPS + entry.name, value, cb)
      }
    }
  })
}

JDEX.prototype.list = function (cb) {
  var r = this.metadb.createReadStream({ gt: PROPS, lt: PROPS + '~' })
  var stream = r.pipe(through.obj(function (row, enc, next) {
    next(null, {
      name: row.key.split('!').slice(1).join('!'),
      properties: row.value
    })
  }))
  return readonly(stream)
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
