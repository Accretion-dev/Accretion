// because the ava test package DO NOT have a global 'before' and 'after' hook
// i had to concat all test scripts into test-final.js
// see test-final.js for all the imports
test.serial('Plugin: officialPlugin test', async t => {
  console.log('turn on')
  console.log('turn off')
  t.pass()
})
