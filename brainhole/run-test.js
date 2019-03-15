// ava do not have a global 'before' and 'after' hook for test, must use this ugly method to generate final test
// see https://github.com/avajs/ava/issues/1602
let chokidar = require('chokidar')
let glob = require('glob')
let watcher = chokidar.watch(['server-src/**/test.js', './test.js', 'test-suffix.js'])
let concat = require('concat')
watcher.on('change', (path, stats) => {
  let files = glob.sync('server-src/**/test.js')
  let fullfiles = ['test.js', ...files, 'test-suffix.js']
  concat(fullfiles, './test-final.js')
  console.log('rebuild test-final.js')
})
