let allgood = false
test.after(async t => {
  allgood = true
})
test.after.always(async t => {
  console.log('Tear down complete')
  if (!allgood) {
    debugger
  }
})
