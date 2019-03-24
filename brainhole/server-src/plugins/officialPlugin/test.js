// because the ava test package DO NOT have a global 'before' and 'after' hook
// i had to concat all test scripts into test-final.js
// see test-final.js for all the imports
test.serial.only('Plugin: officialPlugin', async t => {
  let tname
  async function testData({r, componentUID, op}) {
    for (let each of r.result) {
      let obj = await globals.Models[each.model].findOne({id:each.id})
      if (op === 'on') {
        t.truthy(obj)
        let origin = obj.origin.find(_ => _.id === componentUID)
        t.truthy(origin)
      } else if (op === 'off') {
        if (obj) {
          t.truthy(obj)
          let origin = obj.origin.find(_ => _.id === componentUID)
          t.falsy(origin)
        } else {
          t.true(each.origin_flags.entry)
        }
      }
    }
  }
  let uid = 'officialPlugin'
  let componentUID,r
  // turn on
  let plugin = globals.plugins.find(_ => _.uid === uid)
  // if you run unittest, the active of all plugins is
  //   automatically set to true(but the turnOn function is not automatically run)
  // all models are set regardless of its active status
  if(tname='test plugin on and off') {
    await globals.pluginAPI({operation:'on', uid})
    t.true(plugin.active === true)
    await globals.pluginAPI({operation:'off', uid})
    t.true(plugin.active === false)
    await globals.pluginAPI({operation:'on', uid})
    t.true(plugin.active === true)
  }
  if(tname='test data on and off') {
    componentUID = `${uid}[data]pluginHookDemo`
    r = await globals.pluginAPI({operation:'on', uid, component:'data', componentUID})
    await testData({r, componentUID, op:'on'})
    r = await globals.pluginAPI({operation:'off', uid, component:'data', componentUID})
    await testData({r, componentUID, op:'off'})
  }
  if(tname='test hook simularTags') {
  }
  if(tname='test hook addAncesotrTags') {
  }
  if(tname='test hook groupRelations') {
  }
  if(tname='test hook translationTags') {
  }
  if(tname='test hook ambiguousTags') {
  }
  t.pass()
})
