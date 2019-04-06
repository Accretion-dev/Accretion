// ava do not have a global 'before' and 'after' hook for test, must use this ugly method to generate final test
// see https://github.com/avajs/ava/issues/1602
let chokidar = require('chokidar')
let glob = require('glob')
let watcher = chokidar.watch(['../server/**/test.js', 'test.js', 'test-suffix.js'])
let concat = require('concat')
function genFinalTest (path, stats) {
  let files = glob.sync('../server/**/test.js')
  let fullfiles = ['test.js', ...files, 'test-suffix.js']
  concat(fullfiles, 'test-final.js')
  console.log('rebuild test-final.js')
}
genFinalTest()
watcher.on('change', genFinalTest)
