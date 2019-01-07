(function () {
  var repl = require('repl')
  process.stdin.push('.load ./index.js\n')
  repl.start({
    useGlobal:true,
    ignoreUndefined:true,
    prompt:'> '
  })
})()
