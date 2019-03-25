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
  let componentUID, component, r, data, query, origin
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
    component = 'data'
    componentUID = `${uid}[${component}]pluginHookDemo`
    r = await globals.pluginAPI({operation:'on', uid, component, componentUID})
    await testData({r, componentUID, op:'on'})
    r = await globals.pluginAPI({operation:'off', uid, component, componentUID})
    await testData({r, componentUID, op:'off'})
  }
  if(tname='test hook groupRelations') {
    component = 'hook'
    componentUID = `${uid}[${component}]groupRelationTag`
    if(tname='add unitttest data') {
      data = [
        {model: "Relation", data: [
          {name: 'simular'},
          {name: 'translation'},
        ]},
        {model: "Tag", data: [
          // test simular
          {name: 'good', relations: [
            {relation: {name: 'simular'}, from:{name: 'nice'}},
          ]},
          {name: 'nice', relations: [
            {relation: {name: 'simular'}, from:{name: 'great'}},
          ]},
          {name: 'great', relations: [
            {relation: {name: 'simular'}, from:{name: 'fine'}},
          ]
          },
          {name: 'fine'},

          {name: 'bad', relations: [
            {relation: {name: 'simular'}, from:{name: 'evil'}},
          ]},
          {name: 'evil', relations: [
            {relation: {name: 'simular'}, from:{name: 'awful'}},
          ]},
          {name: 'awful'},

          {name: 'hungry'},
          {name: 'starve'},
          {name: 'famish'},

          // test translation
          {name: 'foo(en)', relations:[
            {relation: {name: 'translation'}, from:{name: 'foo(zh)'}},
          ]},
          {name: 'foo(zh)', relations:[
            {relation: {name: 'translation'}, from:{name: 'foo(jp)'}},
          ]},
          {name: 'foo(jp)', relations:[
            {relation: {name: 'translation'}, from:{name: 'foo(fr)'}},
          ]},
          {name: 'foo(fr)'},

          {name: 'bar(en)', relations:[
            {relation: {name: 'translation'}, from:{name: 'bar(zh)'}},
          ]},
          {name: 'bar(zh)', relations:[
            {relation: {name: 'translation'}, from:{name: 'bar(zh)'}},
          ]},
          {name: 'bar(jp)'},
          {name: 'bar(fr)'},

          {name: 'ha(en)'},
          {name: 'ha(zh)'},
          {name: 'ha(jp)'},
          {name: 'ha(fr)'},

        ]},
      ]
      await globals.bulkOP({operation: '+', data})
    }
    if(tname='turn on'){
      let result = await globals.pluginAPI({operation:'on', uid, component, componentUID})
    }
    if(tname='turn off'){
      let result = await globals.pluginAPI({operation:'off', uid, component, componentUID})
    }

  }
  if(0&&(tname='test hook simularTags')) {
    component = 'hook'
    componentUID = `${uid}[${component}]simularTags`
    let hook = plugin.hook.find(_ => _.uid === componentUID)
    if(tname='add unitttest data') {
      data = [
        {model: "Relation", data: [
          {name: 'simular'},
        ]},
        {model: "Tag", data: [
          // test clarify hook
          {name: 'good', relations: [
            {relation: {name: 'simular'}, from:{name: 'nice'}},
            {relation: {name: 'simular'}, from:{name: 'great'}},
            {relation: {name: 'simular'}, from:{name: 'fine'}},
          ]},
          {name: 'nice'},
          {name: 'great'},
          {name: 'fine'},

          {name: 'bad', relations: [
            {relation: {name: 'simular'}, from:{name: 'evil'}},
            {relation: {name: 'simular'}, from:{name: 'awful'}},
          ]},
          {name: 'evil'},
          {name: 'awful'},

          {name: 'hungry', relations: [
            {relation: {name: 'simular'}, from:{name: 'starve'}},
            {relation: {name: 'simular'}, from:{name: 'famish'}},
          ]},
          {name: 'starve'},
          {name: 'famish'},
        ]},
        {model: "Article", data: [
          // test the next hook
          {
            title: `${tname} 1`,
            tags:[
              {tag: {name: 'good'}},
              {tag: {name: 'evil'}},
              {tag: {name: 'famish'}},
            ],
          },
          {
            title: `${tname} 2`,
            tags:[ {tag: {name: 'good'}}]
          },
          {
            title: `${tname} 3`,
            tags:[ {tag: {name: 'awful'}}]
          },
          {
            title: `${tname} 4`,
            tags:[ {tag: {name: 'famish'}}]
          },
        ]}
      ]
      await globals.bulkOP({operation: '+', data})
    }
    if(tname='turn on'){
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
    }
    if(0&&(tname='turn off')){
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
    }
    if(tname='add hook'){
      if(tname='add without field'){

      }
      if(tname='add with field'){

      }
      if(tname='modify with field, raise error'){

      }
      if(tname='delete with field'){

      }

    }
  }
  if(tname='test hook addAncesotrTags') {
  }
  if(tname='test hook translationTags') {
  }
  if(tname='test hook ambiguousTags') {
  }
  t.pass()
})
