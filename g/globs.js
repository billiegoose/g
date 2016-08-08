'use strict'
const glob = require('glob')

module.exports = {
  globs (patterns, callback) {
    if (typeof patterns === 'string') {
      return glob(patterns, callback)
    } else if (patterns.length === 1) {
      return glob(patterns[0], callback)
    } else if (patterns.length > 1) {
      return glob('{' + patterns.join(',') + '}', callback)
    }
  }
}
