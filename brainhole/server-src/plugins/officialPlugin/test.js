// because the ava test package DO NOT have a global 'before' and 'after' hook
// i had to concat all test scripts into test-final.js
// see test-final.js for all the imports
test.serial('Plugin: officialPlugin', async t => {
  let tname, result, refetch
  async function testData({r, componentUID, op, type}) {
    for (let each of r.data) {
      let obj = await globals.Models[each.model].findOne({id:each.id})
      if (op === 'on') {
        t.truthy(obj)
        let origin = obj.origin.find(_ => _.id.startsWith(componentUID) && _.type === type)
        t.truthy(origin)
      } else if (op === 'off') {
        if (obj) {
          t.truthy(obj)
          let origin = obj.origin.find(_ => _.id.startsWith(componentUID) && _.type === type)
          t.falsy(origin)
        } else {
          t.true(each.origin_flags.entry)
        }
      }
    }
  }
  async function testTagRelationCount(datas) {
    let datacal = []
    for (let data of datas) {
      let obj = await globals.Models.Tag.findOne({name: data[0]})
      if (!obj) t.fail(`tag name ${data[0]} not exists`)
      datacal.push([data[0], obj.relations.length])
    }
    t.deepEqual(datacal, datas)
  }
  async function testTagCount(datas) {
    let datacal = []
    for (let data of datas) {
      let obj = await globals.Models.Article.findOne({title: data[0]})
      if (!obj) t.fail(`Article title ${data[0]} not exists`)
      datacal.push([data[0], obj.tags.length])
    }
    t.deepEqual(datacal, datas)
  }
  async function testTagOriginCount(datas) {
    let datacal = []
    for (let data of datas) {
      let obj = await globals.Models.Article.findOne({title: data[0]})
      if (!obj) t.fail(`Article title ${data[0]} not exists`)
      let r = {}
      for (let tag of obj.tags) {
        if (tag.tag_name in data[1]) r[tag.tag_name] = tag.origin.length
      }
      datacal.push([data[0], r])
    }
    t.deepEqual(datacal, datas)
  }
  async function testTagArticleRevCount(datas) {
    let datacal = []
    for (let data of datas) {
      let obj = await globals.Models.Tag.findOne({name: data[0]})
      if (!obj) t.fail(`Tag name ${data[0]} not exists`)
      datacal.push([data[0], obj.r.Article.length])
    }
    t.deepEqual(datacal, datas)
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
    await testData({r, componentUID, op:'on', type:'data'})
    r = await globals.pluginAPI({operation:'off', uid, component, componentUID})
    await testData({r, componentUID, op:'off', type:'data'})
  }
  if(1&&(tname='test hook groupRelations')) {
    component = 'hook'
    componentUID = `${uid}[${component}]groupRelationTag`
    if(tname='add unitttest data') {
      data = [
        {model: "Relation", data: [
          {name: 'simular'},
          {name: 'translation'},
          {name: 'blabla'},
        ]},
        {model: "Tag", data: [
          // test simular
          {name: 'good', relations: [
            {relation: {name: 'simular'}, other:{name: 'nice'}},
          ]},
          {name: 'nice', relations: [
            {relation: {name: 'simular'}, other:{name: 'great'}},
          ]},
          {name: 'great', relations: [
            {relation: {name: 'simular'}, other:{name: 'fine'}},
          ]
          },
          {name: 'fine'},

          {name: 'bad', relations: [
            {relation: {name: 'simular'}, other:{name: 'evil'}},
          ]},
          {name: 'evil', relations: [
            {relation: {name: 'simular'}, other:{name: 'awful'}},
          ]},
          {name: 'awful'},

          {name: 'hungry'},
          {name: 'starve'},
          {name: 'famish'},

          // test translation
          {name: 'foo(en)', relations:[
            {relation: {name: 'translation'}, other:{name: 'foo(zh)'}},
          ]},
          {name: 'foo(zh)', relations:[
            {relation: {name: 'translation'}, other:{name: 'foo(jp)'}},
          ]},
          {name: 'foo(jp)', relations:[
            {relation: {name: 'translation'}, other:{name: 'foo(fr)'}},
          ]},
          {name: 'foo(fr)'},

          {name: 'bar(en)', relations:[
            {relation: {name: 'translation'}, other:{name: 'bar(zh)'}},
          ]},
          {name: 'bar(zh)', relations:[
            {relation: {name: 'translation'}, other:{name: 'bar(jp)'}},
          ]},
          {name: 'bar(jp)'},
          {name: 'bar(fr)'},

          {name: 'ha(en)', relations:[
            {relation: {name: 'translation'}, other:{name: 'ha(zh)'}},
            {relation: {name: 'translation'}, other:{name: 'ha(jp)'}},
            {relation: {name: 'translation'}, other:{name: 'ha(fr)'}},
          ]},
          {name: 'ha(zh)'},
          {name: 'ha(jp)'},
          {name: 'ha(fr)'},

        ]},
      ]
      await globals.bulkOP({operation: '+', data})
    }
    if(tname='turn on and off'){
      t.true((await globals.Models.Relation.findOne({name: 'simular'})).origin.length == 1)
      t.true((await globals.Models.Relation.findOne({name: 'translation'})).origin.length == 1)
      result = await globals.pluginAPI({operation:'on', uid, component, componentUID})
      t.true((await globals.Models.Relation.findOne({name: 'simular'})).origin.length == 2)
      t.true((await globals.Models.Relation.findOne({name: 'translation'})).origin.length == 2)
      await testTagRelationCount([
        ['good', 3,],
        ['nice', 3,],
        ['great', 3,],
        ['fine', 3,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 3,],
        ['foo(zh)', 3,],
        ['foo(jp)', 3,],
        ['foo(fr)', 3,],
        ['bar(en)', 2,],
        ['bar(zh)', 2,],
        ['bar(jp)', 2,],
        ['bar(fr)', 0,],
        ['ha(en)', 3,],
        ['ha(zh)', 3,],
        ['ha(jp)', 3,],
        ['ha(fr)', 3,],
      ])
      result = await globals.pluginAPI({operation:'off', uid, component, componentUID})
      t.true((await globals.Models.Relation.findOne({name: 'simular'})).origin.length == 1)
      t.true((await globals.Models.Relation.findOne({name: 'translation'})).origin.length == 1)
      await testTagRelationCount([
        ['good', 1,],
        ['nice', 2,],
        ['great', 2,],
        ['fine', 1,],
        ['bad', 1,],
        ['evil', 2,],
        ['awful', 1,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 1,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 1,],
        ['bar(en)', 1,],
        ['bar(zh)', 2,],
        ['bar(jp)', 1,],
        ['bar(fr)', 0,],
        ['ha(en)', 3,],
        ['ha(zh)', 1,],
        ['ha(jp)', 1,],
        ['ha(fr)', 1,],
      ])
      result = await globals.pluginAPI({operation:'on', uid, component, componentUID})
    }
    if(tname='test delete group relations, throw errors'){
      let componentObj = plugin[component].find(_ => _.uid === componentUID)
      for (let group of componentObj.parameters.groups) {
        let fn = async () => {
          await globals.api({
            operation: '-',
            model: 'Relation',
            query: {name: group},
            origin: []
          })
        }
        let error = await t.throwsAsync(fn, Error)
        t.true(error.message.startsWith(`The hook:${componentObj.uid}`))
      }
    }
    if((tname='create new tag and add into this group')){
      // connects:
      // good<>nice,nice<>great,great<>fine
      // bad <>evil, evil<>awful
      // foo(en)<>foo(zh),foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      result = await globals.api({
        operation: '+',
        model: 'Tag',
        data:{
          name: 'veryGood',
          relations:[
            {relation:{name:'simular'}, other:{name: 'good'}},
            {relation:{name:'simular'}, other:{name: 'fine'}},
          ]
        }
      })
      // connects:
      // good<>nice,nice<>great,great<>fine,veryGood<>good,vefyGood<>fine
      // bad <>evil, evil<>awful
      // foo(en)<>foo(zh),foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      await testTagRelationCount([
        ['good', 4,],
        ['nice', 4,],
        ['great', 4,],
        ['fine', 4,],
        ['veryGood', 4,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 3,],
        ['foo(zh)', 3,],
        ['foo(jp)', 3,],
        ['foo(fr)', 3,],
        ['bar(en)', 2,],
        ['bar(zh)', 2,],
        ['bar(jp)', 2,],
        ['bar(fr)', 0,],
        ['ha(en)', 3,],
        ['ha(zh)', 3,],
        ['ha(jp)', 3,],
        ['ha(fr)', 3,],
      ])
      // connects:
      // good<>nice,nice<>great,great<>fine,veryGood<>good,vefyGood<>fine
      // bad <>evil, evil<>awful
      // foo(en)<>foo(zh),foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      result = await globals.api({
        operation: '+',
        model: 'Tag',
        data:{
          name: 'bar(zz)',
          relations:[
            {relation:{name:'translation'}, other:{name: 'foo(en)'}},
            {relation:{name:'translation'}, other:{name: 'bar(en)'}},
          ]
        }
      })
      // connects:
      // good<>nice,nice<>great,great<>fine,veryGood<>good,vefyGood<>fine
      // bad <>evil, evil<>awful
      // foo(en)<>foo(zh),foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      // bar(zz)<>foo(en),bar(zz)<>bar(en)
      await testTagRelationCount([
        ['good', 4,],
        ['nice', 4,],
        ['great', 4,],
        ['fine', 4,],
        ['veryGood', 4,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 7,],
        ['foo(zh)', 7,],
        ['foo(jp)', 7,],
        ['foo(fr)', 7,],
        ['bar(en)', 7,],
        ['bar(zh)', 7,],
        ['bar(jp)', 7,],
        ['bar(fr)', 0,],
        ['bar(zz)', 7,],
        ['ha(en)', 3,],
        ['ha(zh)', 3,],
        ['ha(jp)', 3,],
        ['ha(fr)', 3,],
      ])
    }
    if(tname='add new tag into this group, with field'){
      result = await globals.api({
        operation: '+',
        model: 'Tag',
        field: 'relations',
        query: {name: 'bar(fr)'},
        data:{
          relations:[
            {relation:{name:'translation'}, other:{name: 'bar(zz)'}},
          ]
        }
      })
      // connects:
      // good<>nice,nice<>great,great<>fine,veryGood<>good,vefyGood<>fine
      // bad <>evil, evil<>awful
      // foo(en)<>foo(zh),foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      // bar(zz)<>foo(en),bar(zz)<>bar(en),bar(zz)<>bar(fr)
      await testTagRelationCount([
        ['good', 4,],
        ['nice', 4,],
        ['great', 4,],
        ['fine', 4,],
        ['veryGood', 4,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 8,],
        ['foo(zh)', 8,],
        ['foo(jp)', 8,],
        ['foo(fr)', 8,],
        ['bar(en)', 8,],
        ['bar(zh)', 8,],
        ['bar(jp)', 8,],
        ['bar(fr)', 8,],
        ['bar(zz)', 8,],
        ['ha(en)', 3,],
        ['ha(zh)', 3,],
        ['ha(jp)', 3,],
        ['ha(fr)', 3,],
      ])
    }
    if(tname='delete'){
      // do not leave group
      // connects:
      // good<>nice,nice<>great,great<>fine,veryGood<>good,vefyGood<>fine
      // bad <>evil, evil<>awful
      // foo(en)<>foo(zh),foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      // bar(zz)<>foo(en),bar(zz)<>bar(en),bar(zz)<>bar(fr)
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        field: 'relations',
        query: {name: 'foo(zh)'},
        data:{
          relations:[
            {__query__:{relation:{name:'translation'}, other:{name: 'foo(en)'}}},
          ]
        }
      })
      // connects:
      // good<>nice,nice<>great,great<>fine,veryGood<>good,vefyGood<>fine
      // bad <>evil, evil<>awful
      // foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      // bar(zz)<>foo(en),bar(zz)<>bar(en),bar(zz)<>bar(fr)
      await testTagRelationCount([
        ['good', 4,],
        ['nice', 4,],
        ['great', 4,],
        ['fine', 4,],
        ['veryGood', 4,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 5,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 2,],
        ['bar(en)', 5,],
        ['bar(zh)', 5,],
        ['bar(jp)', 5,],
        ['bar(fr)', 5,],
        ['bar(zz)', 5,],
        ['ha(en)', 3,],
        ['ha(zh)', 3,],
        ['ha(jp)', 3,],
        ['ha(fr)', 3,],
      ])
      // leave group
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'bar(zz)'},
      })
      // connects:
      // good<>nice,nice<>great,great<>fine,veryGood<>good,vefyGood<>fine
      // bad <>evil, evil<>awful
      // foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      await testTagRelationCount([
        ['good', 4,],
        ['nice', 4,],
        ['great', 4,],
        ['fine', 4,],
        ['veryGood', 4,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 0,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 2,],
        ['bar(en)', 2,],
        ['bar(zh)', 2,],
        ['bar(jp)', 2,],
        ['bar(fr)', 0,],
        ['ha(en)', 3,],
        ['ha(zh)', 3,],
        ['ha(jp)', 3,],
        ['ha(fr)', 3,],
      ])
      // do not leave group
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'ha(en)'}
      })
      // connects:
      // good<>nice,nice<>great,great<>fine,veryGood<>good,vefyGood<>fine
      // bad <>evil, evil<>awful
      // foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      await testTagRelationCount([
        ['good', 4,],
        ['nice', 4,],
        ['great', 4,],
        ['fine', 4,],
        ['veryGood', 4,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 0,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 2,],
        ['bar(en)', 2,],
        ['bar(zh)', 2,],
        ['bar(jp)', 2,],
        ['bar(fr)', 0,],
        ['ha(zh)', 0,],
        ['ha(jp)', 0,],
        ['ha(fr)', 0,],
      ])
      // do not leave group
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        field: 'relations',
        query: {name: 'veryGood'},
        data:{
          relations:[
            {__query__:{relation:{name:'simular'}, other:{name: 'fine'}}},
          ]
        }
      })
      // good<>nice,nice<>great,great<>fine,veryGood<>good,
      // bad <>evil, evil<>awful
      // foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      await testTagRelationCount([
        ['good', 4,],
        ['nice', 4,],
        ['great', 4,],
        ['fine', 4,],
        ['veryGood', 4,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 0,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 2,],
        ['bar(en)', 2,],
        ['bar(zh)', 2,],
        ['bar(jp)', 2,],
        ['bar(fr)', 0,],
        ['ha(zh)', 0,],
        ['ha(jp)', 0,],
        ['ha(fr)', 0,],
      ])
      // leave group
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        field: 'relations',
        query: {name: 'great'},
        data:{
          relations:[
            {__query__:{relation:{name:'simular'}, other:{name: 'nice'}}},
          ]
        }
      })
      // good<>nice, great<>fine,veryGood<>good,
      // bad <>evil, evil<>awful
      // foo(zh)<>foo(jp),foo(jp)<>foo(fr)
      // bar(en)<>bar(zh),bar(zh)<>bar(jp)
      await testTagRelationCount([
        ['good', 2,],
        ['nice', 2,],
        ['great', 1,],
        ['fine', 1,],
        ['veryGood', 2,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 0,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 2,],
        ['bar(en)', 2,],
        ['bar(zh)', 2,],
        ['bar(jp)', 2,],
        ['bar(fr)', 0,],
        ['ha(zh)', 0,],
        ['ha(jp)', 0,],
        ['ha(fr)', 0,],
      ])
    }
    if(tname='modify to add'){
      result = await globals.api({
        operation: '+',
        model: 'Tag',
        field: 'relations',
        query: {name: 'bar(fr)'},
        data:{
          relations:[
            {relation:{name:'blabla'}, other:{name: 'bar(jp)'}},
          ]
        }
      })
      await testTagRelationCount([
        ['good', 2,],
        ['nice', 2,],
        ['great', 1,],
        ['fine', 1,],
        ['veryGood', 2,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 0,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 2,],
        ['bar(en)', 2,],
        ['bar(zh)', 2,],
        ['bar(jp)', 3,],
        ['bar(fr)', 1,],
        ['ha(zh)', 0,],
        ['ha(jp)', 0,],
        ['ha(fr)', 0,],
      ])
      result = await globals.api({
        operation: '*',
        model: 'Tag',
        field: 'relations',
        query: {name: 'bar(fr)'},
        data:{
          relations:[
            {__query__:{relation:{name:'blabla'}, other:{name: 'bar(jp)'}},
             relation:{name: 'translation'}},
          ]
        }
      })
      await testTagRelationCount([
        ['good', 2,],
        ['nice', 2,],
        ['great', 1,],
        ['fine', 1,],
        ['veryGood', 2,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 0,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 2,],
        ['bar(en)', 3,],
        ['bar(zh)', 3,],
        ['bar(jp)', 3,],
        ['bar(fr)', 3,],
        ['ha(zh)', 0,],
        ['ha(jp)', 0,],
        ['ha(fr)', 0,],
      ])
    }
    if(tname='delete tags'){
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'bar(fr)'},
      })
      await testTagRelationCount([
        ['good', 2,],
        ['nice', 2,],
        ['great', 1,],
        ['fine', 1,],
        ['veryGood', 2,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 0,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 2,],
        ['bar(en)', 2,],
        ['bar(zh)', 2,],
        ['bar(jp)', 2,],
        ['ha(zh)', 0,],
        ['ha(jp)', 0,],
        ['ha(fr)', 0,],
      ])
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'bar(jp)'},
      })
      await testTagRelationCount([
        ['good', 2,],
        ['nice', 2,],
        ['great', 1,],
        ['fine', 1,],
        ['veryGood', 2,],
        ['bad', 2,],
        ['evil', 2,],
        ['awful', 2,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 0,],
        ['foo(zh)', 2,],
        ['foo(jp)', 2,],
        ['foo(fr)', 2,],
        ['bar(en)', 1,],
        ['bar(zh)', 1,],
        ['ha(zh)', 0,],
        ['ha(jp)', 0,],
        ['ha(fr)', 0,],
      ])
    }

    if('turn off and delete unittest data'){
      // turn off and test last
      result = await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagRelationCount([
        ['good', 2,],
        ['nice', 1,],
        ['great', 1,],
        ['fine', 1,],
        ['veryGood', 1,],
        ['bad', 1,],
        ['evil', 2,],
        ['awful', 1,],
        ['hungry', 0,],
        ['starve', 0,],
        ['famish', 0,],
        ['foo(en)', 0,],
        ['foo(zh)', 1,],
        ['foo(jp)', 2,],
        ['foo(fr)', 1,],
        ['bar(en)', 1,],
        ['bar(zh)', 1,],
        ['ha(zh)', 0,],
        ['ha(jp)', 0,],
        ['ha(fr)', 0,],
      ])
      await globals.Models.Tag.deleteMany({})
      await globals.Models.Relation.deleteMany({})
    }
  }
  if(1&&(tname='test hook ancestorTags')) {
    component = 'hook'
    componentUID = `${uid}[${component}]ancestorTags`
    if(tname='add unitttest data') {
      data = [
        {model: "Tag", data: [
          {name: '1', children:[{name: '1.1'},{name: '1.2'},{name: '1.3'}]},
          {name: '1.1', children:[{name:'1.1.1'}]},
          {name: '1.1.1', children:[{name:'1.1.1.1'}]},
          {name: '1.1.1.1', children:[{name:'1.1.1.1.1'}]},
          {name: '1.1.1.1.1', fathers:[{name:'1.1.1'}]},
          {name: '1.2', children:[{name:'1.2.1'},{name:'1.2.2'}]},
          {name: '1.2.1'},
          {name: '1.2.2', children:[{name:'1.2.2.1'}]},
          {name: '1.2.2.1'},
          {name: '1.3', children:[{name:'1.3.1'}]},
          {name: '1.3.1', children:[{name:'1.3.1.1'},{name:'1.3.1.2'}]},
          {name: '1.3.1.1'},
          {name: '1.3.1.2', fathers:[{name:'3.2'}]},
          {name: '2', children:[{name:'2.1'},{name:'2.2'}]},
          {name: '2.1'},
          {name: '2.2'},
          {name: '3', children:[{name:'3.1'},{name:'3.2'}]},
          {name: '3.1'},
          {name: '3.2'},
        ]},
        {model: "Article", data: [
          {title: '1', tags:[
            {tag: {name:'1.2.2.1'}},
            {tag: {name:'1.3.1'}},
            {tag: {name:'1.1.1.1.1'}},
            {tag: {name:'1.1.1'}},
          ]},
          {title: '2', tags: [
            {tag: {name:'1.3.1.2'}},
            {tag: {name:'2.2'}},
          ]},
          {title: '3', tags: [
            {tag: {name:'1.3.1.2'}},
            {tag: {name:'3.2'}},
          ]},
          {title: '4', tags: [
            {tag: {name:'1.1.1.1'}},
          ]},
          {title: '5', tags: [
            {tag: {name:'1.2.1'}},
            {tag: {name:'1.3.1.1'}},
            {tag: {name:'1.3'}},
          ]},
        ]},
      ]
      await globals.bulkOP({operation: '+', data})
      await testTagCount([
        ['1', 4],
        ['2', 2],
        ['3', 2],
        ['4', 1],
        ['5', 3],
      ])
    }
    if(tname='turn on and off'){
      result = await globals.pluginAPI({operation:'on', uid, component, componentUID})
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1, 1.3,
      //    1.1.1.1, 1.1.1.1, 1.1.1, 1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1, 3.2, 3
      //    2.2, 2
      // 3: 3.2, 3
      //    1.3.1.2, 1.3.1, 1.3, 1,
      // 4: 1.1.1.1, 1.1.1, 1.1, 1
      // 5: 1.2.1, 1.2, 1, 1.3.1.1, 1.3.1, 1.3
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 6],
        ['4', 4],
        ['5', 6],
      ])
      result = await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagCount([
        ['1', 4],
        ['2', 2],
        ['3', 2],
        ['4', 1],
        ['5', 3],
      ])
      result = await globals.pluginAPI({operation:'on', uid, component, componentUID})
    }
    if(tname='add and delete by field'){
      result = await globals.api({
        operation: '+',
        model: 'Article',
        field: 'tags',
        query: {title: '4'},
        data:{
          tags:[
            {tag:{name:'1.1'}},
          ]
        }
      })
      refetch = await globals.Models.Article.findOne({title: '4'})
      t.true(refetch._doc.tags[2].origin[1].id === 'manual')
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 6],
        ['4', 4],
        ['5', 6],
      ])
      // +
      result = await globals.api({
        operation: '+',
        model: 'Article',
        field: 'tags',
        query: {title: '4'},
        data:{
          tags:[
            {tag:{name:'3.2'}},
          ]
        }
      })
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 6],
        ['4', 6],
        ['5', 6],
      ])
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1, 1.3,
      //    1.1.1.1.1, 1.1.1.1, 1.1.1, 1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1, 3.2, 3
      //    2.2, 2
      // 3: 3.2, 3
      //    1.3.1.2, 1.3.1, 1.3, 1,
      // 4: 1.1.1.1, 1.1.1, 1.1, 1, 3.2, 3
      // 5: 1.2.1, 1.2, 1, 1.3.1.1, 1.3.1, 1.3
      // -
      result = await globals.api({
        operation: '-',
        model: 'Article',
        field: 'tags',
        query: {title: '4'},
        data:{
          tags:[
            {__query__:{tag:{name:'3.2'}}},
          ]
        }
      })
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 6],
        ['4', 4],
        ['5', 6],
      ])
      // -
      result = await globals.api({
        operation: '-',
        model: 'Article',
        field: 'tags',
        query: {title: '4'},
        data:{
          tags:[
            {__query__:{tag:{name:'1.1'}}},
          ]
        }
      })
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 6],
        ['4', 4],
        ['5', 6],
      ])
      await testTagArticleRevCount([
        ['1.3.1.2', 2]
      ])
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1, 1.3,
      //    1.1.1.1.1, 1.1.1.1, 1.1.1, 1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1, 3.2, 3
      //    2.2, 2
      // 3: 3.2, 3
      //    1.3.1.2, 1.3.1, 1.3, 1,
      // 4: 1.1.1.1, 1.1.1, 1.1, 1
      // 5: 1.2.1, 1.2, 1, 1.3.1.1, 1.3.1, 1.3
      // -
      result = await globals.api({
        operation: '-',
        model: 'Article',
        field: 'tags',
        query: {title: '3'},
        data:{
          tags:[
            {__query__:{tag:{name:'1.3.1.2'}}},
          ]
        }
      })
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1, 1.3,
      //    1.1.1.1.1, 1.1.1.1, 1.1.1, 1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1, 3.2, 3
      //    2.2, 2
      // 3: 3.2, 3
      // 4: 1.1.1.1, 1.1.1, 1.1, 1
      // 5: 1.2.1, 1.2, 1, 1.3.1.1, 1.3.1, 1.3
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 2],
        ['4', 4],
        ['5', 6],
      ])
      await testTagArticleRevCount([
        ['1.3.1.2', 1]
      ])
      // -
      result = await globals.api({
        operation: '-',
        model: 'Article',
        field: 'tags',
        query: {title: '3'},
        data:{
          tags:[
            {__query__:{tag:{name:'3'}}},
          ]
        }
      })
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 2],
        ['4', 4],
        ['5', 6],
      ])
      // -
      result = await globals.api({
        operation: '-',
        model: 'Article',
        field: 'tags',
        query: {title: '3'},
        data:{
          tags:[
            {__query__:{tag:{name:'3.2'}}},
          ]
        }
      })
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 0],
        ['4', 4],
        ['5', 6],
      ])
      // +
      result = await globals.api({
        operation: '+',
        model: 'Article',
        field: 'tags',
        query: {title: '3'},
        data:{
          tags:[
            {tag:{name:'3.2'}},
          ]
        }
      })
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 2],
        ['4', 4],
        ['5', 6],
      ])
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1, 1.3,
      //    1.1.1.1.1, 1.1.1.1, 1.1.1, 1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1, 3.2, 3
      //    2.2, 2
      // 3: 3.2, 3
      // 4: 1.1.1.1, 1.1.1, 1.1, 1
      // 5: 1.2.1, 1.2, 1, 1.3.1.1, 1.3.1, 1.3
      result = await globals.api({
        operation: '-',
        model: 'Article',
        query: {title: '5'},
      })
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 2],
        ['4', 4],
      ])
    }
    if(tname='add and delete tag family, refresh all related entries'){
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1, 1.3,
      //    1.1.1.1.1, 1.1.1.1, 1.1.1, 1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1, 3.2, 3
      //    2.2, 2
      // 3: 3.2, 3
      // 4: 1.1.1.1, 1.1.1, 1.1, 1
      // +
      result = await globals.api({
        operation: '+',
        model: 'Tag',
        field: 'fathers',
        query: {name: '3'},
        data:{
          fathers:[
            {name:'2.2'},
          ]
        }
      })
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 4],
        ['4', 4],
      ])
      // -
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        field: 'fathers',
        query: {name: '3'},
        data:{
          fathers:[
            {name:'2.2'},
          ]
        }
      })
      await testTagCount([
        ['1', 10],
        ['2', 8],
        ['3', 2],
        ['4', 4],
      ])
      // -
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        field: 'fathers',
        query: {name: '1.3.1.2'},
        data:{
          fathers:[
            {name:'3.2'},
          ]
        }
      })
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1, 1.3,
      //    1.1.1.1, 1.1.1.1, 1.1.1, 1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1,
      //    2.2, 2
      // 3: 3.2, 3
      // 4: 1.1.1.1.1 1.1.1, 1.1, 1
      await testTagCount([
        ['1', 10],
        ['2', 6],
        ['3', 2],
        ['4', 4],
      ])
      // -
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        field: 'children',
        query: {name: '1.1'},
        data:{
          children:[
            {name:'1.1.1'},
          ]
        }
      })
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1, 1.3,
      //    1.1.1.1.1, 1.1.1.1, 1.1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1,
      //    2.2, 2
      // 3: 3.2, 3
      // 4: 1.1.1.1, 1.1.1
      await testTagCount([
        ['1', 9],
        ['2', 6],
        ['3', 2],
        ['4', 2],
      ])
      // delete a tag
      // -
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: '1.3'},
      })
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1
      //    1.1.1.1.1, 1.1.1.1, 1.1.1
      // 2: 1.3.1.2, 1.3.1
      //    2.2, 2
      // 3: 3.2, 3
      // 4: 1.1.1.1, 1.1.1
      await testTagCount([
        ['1', 8],
        ['2', 4],
        ['3', 2],
        ['4', 2],
      ])
      // delete a tag
      // -
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: '1.2.2'},
      })
      // 1: 1.2.2.1,
      //    1.3.1
      //    1.1.1.1.1, 1.1.1.1, 1.1.1
      // 2: 1.3.1.2, 1.3.1
      //    2.2, 2
      // 3: 3.2, 3
      // 4: 1.1.1.1, 1.1.1
      await testTagCount([
        ['1', 5],
        ['2', 4],
        ['3', 2],
        ['4', 2],
      ])
    }
    if(tname='turn off and delete unittest data'){
      result = await globals.pluginAPI({operation:'off', uid, component, componentUID})
      // 1: 1.2.2.1,
      //    1.3.1
      //    1.1.1.1.1, 1.1.1
      // 2: 1.3.1.2
      //    2.2
      // 3: 3.2
      // 4: 1.1.1.1
      await testTagCount([
        ['1', 4],
        ['2', 2],
        ['3', 1],
        ['4', 1],
      ])
      await globals.Models.Tag.deleteMany({})
      await globals.Models.Relation.deleteMany({})
      await globals.Models.Article.deleteMany({})
    }
  }
  if(1&&(tname='test hook simularTags')) {
    component = 'hook'
    componentUID = `${uid}[${component}]simularTags`
    let hook = plugin.hook.find(_ => _.uid === componentUID)
    if(tname='add unitttest data') {
      data = [
        {model: "Relation", data: [
          {name: 'simular', symmetric: true},
          {name: 'translation', symmetric: true},
          {name: 'disambiguation', symmetric: false},
          {name: 'blabla', symmetric: false},
        ]},
        {model: "Tag", data: [
          {name: 'good', relations: [
            {relation: {name: 'simular'}, other:{name: 'nice'}},
            {relation: {name: 'simular'}, other:{name: 'great'}},
            {relation: {name: 'simular'}, other:{name: 'fine'}},
          ]},
          {name: 'nice', relations: [
            {relation: {name: 'simular'}, other:{name: 'great'}},
          ]},
          {name: 'great' }, {name: 'fine' },

          {name: 'bad', relations: [
            {relation: {name: 'simular'}, other:{name: 'evil'}},
          ]},
          {name: 'evil', relations: [
            {relation: {name: 'simular'}, other:{name: 'awful'}},
          ]},
          {name: 'awful'},
          {name: 'anyway'},
          {name: 'anyway2'},

          // test translation
          {name: 'foo(en)', relations:[
            {relation: {name: 'translation'}, other:{name: 'foo(zh)'}},
            {relation: {name: 'translation'}, other:{name: 'foo(jp)'}},
            {relation: {name: 'translation'}, other:{name: 'foo(fr)'}},
          ]},
          {name: 'foo(zh)', relations:[
            {relation: {name: 'translation'}, other:{name: 'foo(jp)'}},
          ]},
          {name: 'foo(jp)'}, {name: 'foo(fr)'},

          {name: 'bar(en)', relations:[
            {relation: {name: 'translation'}, other:{name: 'bar(zh)'}},
          ]},
          {name: 'bar(zh)', relations:[
            {relation: {name: 'translation'}, other:{name: 'bar(jp)'}},
          ]},
          {name: 'bar(jp)'}, {name: 'bar(fr)'},

          {name: 'abcd', relations:[
            {relation: {name: 'disambiguation'}, to:{name: 'a'}},
            {relation: {name: 'disambiguation'}, to:{name: 'b'}},
            {relation: {name: 'disambiguation'}, to:{name: 'c'}},
            {relation: {name: 'disambiguation'}, to:{name: 'd'}},
          ]},
          {name: 'a'}, {name: 'b'}, {name: 'c'}, {name: 'd'},

          {name: 'xyz', relations:[
            {relation: {name: 'disambiguation'}, to:{name: 'x'}},
            {relation: {name: 'disambiguation'}, to:{name: 'y'}},
            {relation: {name: 'disambiguation'}, to:{name: 'z'}},
          ]},
          {name: 'x'}, {name: 'y'}, {name: 'z'},
        ]},
        {model: "Article", data: [
          { title: `1`,
            tags:[
              {tag:{name: 'good'}}, {tag:{name: 'great'}},
            ],
          },
          { title: `2`,
            tags:[
              {tag:{name: 'evil'}},
            ],
          },
          { title: `3`,
            tags:[
              {tag:{name: 'foo(en)'}},
            ],
          },
          { title: `4`,
            tags:[
              {tag:{name: 'bar(zh)'}},
            ],
          },
          { title: `5`,
            tags:[
              {tag:{name: 'a'}}, {tag:{name: 'c'}},
            ],
          },
          { title: `6`,
            tags:[
              {tag:{name: 'x'}},
            ],
          },
        ]}
      ]
      await globals.bulkOP({operation: '+', data})
      /*
         1: good
            great
         2: evil
         3: foo(en)
         4: bar(zh)
         5: a
            c
         6: x
      */
      await testTagCount([
        ['1', 2],
        ['2', 1],
        ['3', 1],
        ['4', 1],
        ['5', 2],
        ['6', 1],
      ])
      await testTagOriginCount([
        ['1', {
          good: 1,
          great: 1
        }],
        ['2', {
          evil: 1
        }],
        ['3', {
          'foo(en)': 1
        }],
        ['4', {
          'bar(zh)': 1
        }],
        ['5', {
          a:1,
          c:1
        }],
        ['6', {
          x:1
        }],
      ])
    }
    if(tname='turn on and turn off'){
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
      /*
         1: good
            great
              good => nice, great, fine
              great => good, nice
         2: evil
              evil => awful, bad
         3: foo(en)
              foo(en) => foo(zh), foo(jp), foo(fr)
                foo(zh) => foo(jp)
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
            c
              a => abcd
              c => abcd
         6: x
              x => xyz
      */
      await testTagCount([
        ['1', 4],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 3],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          good: 2,
          great: 2,
          nice: 2,
          fine: 1,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          'foo(en)': 1,
          'foo(zh)': 1,
          'foo(jp)': 2,
          'foo(fr)': 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          c:1,
          abcd:2,
        }],
        ['6', {
          x:1,
          xyz:1,
        }],
      ])
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagCount([
        ['1', 2],
        ['2', 1],
        ['3', 1],
        ['4', 1],
        ['5', 2],
        ['6', 1],
      ])
      await testTagOriginCount([
        ['1', {
          good: 1,
          great: 1
        }],
        ['2', {
          evil: 1
        }],
        ['3', {
          'foo(en)': 1
        }],
        ['4', {
          'bar(zh)': 1
        }],
        ['5', {
          a:1,
          c:1
        }],
        ['6', {
          x:1
        }],
      ])
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
      await testTagCount([
        ['1', 4],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 3],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          good: 2,
          great: 2,
          nice: 2,
          fine: 1,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          'foo(en)': 1,
          'foo(zh)': 1,
          'foo(jp)': 2,
          'foo(fr)': 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          c:1,
          abcd:2,
        }],
        ['6', {
          x:1,
          xyz:1,
        }],
      ])
    }
    if(tname='test delete the related relations, throw errors'){
      let componentObj = plugin[component].find(_ => _.uid === componentUID)
      for (let relation of componentObj.parameters.relations) {
        let fn = async () => {
          await globals.api({
            operation: '-',
            model: 'Relation',
            query: {name: relation.name},
            origin: []
          })
        }
        let error = await t.throwsAsync(fn, Error)
        t.true(error.message.startsWith(`The hook:${componentObj.uid}`))
      }
    }
    if(tname='add and delete by field'){
      /*
         1: good
            great
              good => nice, great, fine
              great => good, nice
         2: evil
              evil => awful, bad
         3: foo(en)
              foo(en) => foo(zh), foo(jp), foo(fr)
                foo(zh) => foo(jp)
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
            c
              a => abcd
              c => abcd
         6: x
              x => xyz
      */
      result = await globals.api({
        operation: '+',
        model: 'Article',
        query: {title: '1'},
        field: 'tags',
        data: {
          tags: [
            {tag: {name: 'nice'}}
          ]
        }
      })
      /*
         1: good
            great
              good => nice, great, fine
              great => good, nice
            nice
              nice => good, great
         2: evil
              evil => awful, bad
         3: foo(en)
              foo(en) => foo(zh), foo(jp), foo(fr)
                foo(zh) => foo(jp)
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
            c
              a => abcd
              c => abcd
         6: x
              x => xyz
      */
      await testTagCount([
        ['1', 4],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 3],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          good: 3,
          great: 3,
          nice: 3,
          fine: 1,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          'foo(en)': 1,
          'foo(zh)': 1,
          'foo(jp)': 2,
          'foo(fr)': 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          c:1,
          abcd:2,
        }],
        ['6', {
          x:1,
          xyz:1,
        }],
      ])
      result = await globals.api({
        operation: '+',
        model: 'Article',
        query: {title: '1'},
        field: 'tags',
        data: {
          tags: [
            {tag: {name: 'evil'}},
            {tag: {name: 'a'}},
            {tag: {name: 'b'}},
            {tag: {name: 'c'}},
          ]
        }
      })
      /*
         1: good
            great
              good => nice, great, fine
              great => good, nice
            nice
              nice => good, great
            evil
            a
            b
            c
              evil => awful, bad
              a => abcd
              b => abcd
              c => abcd
         2: evil
              evil => awful, bad
         3: foo(en)
              foo(en) => foo(zh), foo(jp), foo(fr)
                foo(zh) => foo(jp)
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
            c
              a => abcd
              c => abcd
         6: x
              x => xyz
      */
      await testTagCount([
        ['1', 11],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 3],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          good: 3,
          great: 3,
          nice: 3,
          fine: 1,
          evil: 1,
          a: 1,
          b: 1,
          c: 1,
          awful: 1,
          bad: 1,
          abcd: 3,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          'foo(en)': 1,
          'foo(zh)': 1,
          'foo(jp)': 2,
          'foo(fr)': 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          c:1,
          abcd:2,
        }],
        ['6', {
          x:1,
          xyz:1,
        }],
      ])
      result = await globals.api({
        operation: '-',
        model: 'Article',
        query: {title: '1'},
        field: 'tags',
        data: {
          tags: [
            {__query__:{tag: {name: 'evil'}}},
          ]
        }
      })
      /*
         1: good
            great
              good => nice, great, fine
              great => good, nice
            nice
              nice => good, great
            a
            b
            c
              a => abcd
              b => abcd
              c => abcd
         2: evil
              evil => awful, bad
         3: foo(en)
              foo(en) => foo(zh), foo(jp), foo(fr)
                foo(zh) => foo(jp)
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
            c
              a => abcd
              c => abcd
         6: x
              x => xyz
      */
      await testTagCount([
        ['1', 8],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 3],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          good: 3,
          great: 3,
          nice: 3,
          fine: 1,
          a: 1,
          b: 1,
          c: 1,
          abcd: 3,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          'foo(en)': 1,
          'foo(zh)': 1,
          'foo(jp)': 2,
          'foo(fr)': 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          c:1,
          abcd:2,
        }],
        ['6', {
          x:1,
          xyz:1,
        }],
      ])

      result = await globals.api({
        operation: '-',
        model: 'Article',
        query: {title: '1'},
        field: 'tags',
        data: {
          tags: [
            {__query__:{tag: {name: 'a'}}},
            {__query__:{tag: {name: 'b'}}},
            {__query__:{tag: {name: 'c'}}},
          ]
        }
      })
      /*
         1: good
            great
              good => nice, great, fine
              great => good, nice
            nice
              nice => good, great
         2: evil
              evil => awful, bad
         3: foo(en)
              foo(en) => foo(zh), foo(jp), foo(fr)
                foo(zh) => foo(jp)
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
            c
              a => abcd
              c => abcd
         6: x
              x => xyz
      */
      await testTagCount([
        ['1', 4],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 3],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          good: 3,
          great: 3,
          nice: 3,
          fine: 1,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          'foo(en)': 1,
          'foo(zh)': 1,
          'foo(jp)': 2,
          'foo(fr)': 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          c:1,
          abcd:2,
        }],
        ['6', {
          x:1,
          xyz:1,
        }],
      ])

      result = await globals.api({
        operation: '-',
        model: 'Article',
        query: {title: '1'},
        field: 'tags',
        data: {
          tags: [
            {__query__:{tag: {name: 'good'}}},
          ]
        }
      })
      result = await globals.api({
        operation: '-',
        model: 'Article',
        query: {title: '3'},
        field: 'tags',
        data: {
          tags: [
            {__query__:{tag: {name: 'foo(en)'}}},
          ]
        }
      })
      result = await globals.api({
        operation: '+',
        model: 'Article',
        query: {title: '3'},
        field: 'tags',
        data: {
          tags: [
            {tag: {name: 'anyway'}},
          ]
        }
      })
      result = await globals.api({
        operation: '-',
        model: 'Article',
        query: {title: '4'},
        field: 'tags',
        data: {
          tags: [
            {__query__:{tag: {name: 'bar(en)'}}},
          ]
        }
      })
      result = await globals.api({
        operation: '-',
        model: 'Article',
        query: {title: '5'},
        field: 'tags',
        data: {
          tags: [
            {__query__:{tag: {name: 'c'}}},
          ]
        }
      })
      result = await globals.api({
        operation: '-',
        model: 'Article',
        query: {title: '6'},
        field: 'tags',
        data: {
          tags: [
            {__query__:{tag: {name: 'x'}}},
          ]
        }
      })
      result = await globals.api({
        operation: '+',
        model: 'Article',
        query: {title: '6'},
        field: 'tags',
        data: {
          tags: [
            {tag: {name: 'c'}},
          ]
        }
      })
      /*
         1: great
              great => good, nice
            nice
              nice => good, great
         2: evil
              evil => awful, bad
         3: anyway
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
              a => abcd
         6: c
              c => abcd
      */
      await testTagCount([
        ['1', 3],
        ['2', 3],
        ['3', 1],
        ['4', 3],
        ['5', 2],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          good: 2,
          great: 2,
          nice: 2,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          anyway: 1
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          abcd:1,
        }],
        ['6', {
          c:1,
          abcd:1,
        }],
      ])
      // modify to add
      result = await globals.api({
        operation: '*',
        model: 'Article',
        query: {title: '3'},
        field: 'tags',
        data: {
          tags: [
            {
              __query__:{tag: {name: 'anyway'}},
              tag: {name: 'good'}
            },
          ]
        }
      })
      /*
         1: great
              great => good, nice
            nice
              nice => good, great
         2: evil
              evil => awful, bad
         3: good
              good => nice, great, fine
                nice => great
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
              a => abcd
         6: c
              c => abcd
      */
      await testTagCount([
        ['1', 3],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 2],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          good: 2,
          great: 2,
          nice: 2,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          good: 1,
          nice: 1,
          great: 2,
          fine: 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          abcd:1,
        }],
        ['6', {
          c:1,
          abcd:1,
        }],
      ])
    }
    if(tname='modify with field, raise error'){
      let fn = async () => {
        await globals.api({
          operation: '*',
          model: 'Article',
          query: {title: '3'},
          field: 'tags',
          data: {
            tags: [
              {
                __query__:{tag: {name: 'nice'}},
                tag: {name: 'anyway'}
              },
            ]
          }
        })
      }
      let error = await t.throwsAsync(fn, Error)
      t.true(error.message.startsWith(`can not change key paramerters`))
    }
    if(tname='add and delete tag relation, refresh all related entries'){
      /*
         1: great
              great => good, nice
            nice
              nice => good, great
         2: evil
              evil => awful, bad
         3: good
              good => nice, great, fine
                nice => great
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
              a => abcd
         6: c
              c => abcd
      */
      result = await globals.api({
        operation: '+',
        model: 'Tag',
        query: {name: 'good'},
        field: 'relations',
        data: {
          relations: [
            {
              relation: {name: 'translation'}, other: {name: 'evil'},
            },
            {
              relation: {name: 'disambiguation'}, to: {name: 'a'},
            },
            {
              relation: {name: 'disambiguation'}, from: {name: 'c'},
            },
          ]
        }
      })
      /*
         1: great
              great => good, nice
            nice
              nice => good, great

              good => evil
              good => c
                evil => awful, bad
                c => abcd
         2: evil
              evil => awful, bad

              evil => good
                good => nice, great, fine, c
                  nice => great
                  c => abcd
         3: good
              good => nice, great, fine
                nice => great

              good => evil, c
                evil => awful, bad
                c => abcd
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5: a
              a => abcd

              a => good
                good => nice, great, fine, evil, c
                  nice => great
                  evil => awful, bad
                  c => abcd
         6: c
              c => abcd
      */
      await testTagOriginCount([
        ['1', {
          good: 2,
          great: 2,
          nice: 2,
          evil: 1,
          c: 1,
          awful: 1,
          bad: 1,
          abcd: 1,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
          good: 1,
          nice: 1,
          great: 2,
          fine: 1,
          c: 1,
          abcd: 1,
        }],
        ['3', {
          good: 1,
          nice: 1,
          great: 2,
          fine: 1,
          evil: 1,
          awful: 1,
          bad: 1,
          c: 1,
          abcd: 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          abcd:2,
          good:1,
          nice:1,
          great:2,
          fine:1,
          evil:1,
          c:1,
          awful:1,
          bad:1,
        }],
        ['6', {
          c:1,
          abcd:1,
        }],
      ])
      await testTagCount([
        ['1', 8],
        ['2', 9],
        ['3', 9],
        ['4', 3],
        ['5', 10],
        ['6', 2],
      ])
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'good'},
        field: 'relations',
        data: {
          relations: [
            {
              __query__:{ relation: {name: 'translation'}, other: {name: 'evil'}},
            },
            {
              __query__:{ relation: {name: 'disambiguation'}, to: {name: 'a'}},
            },
            {
              __query__:{relation: {name: 'disambiguation'}, from: {name: 'c'}},
            },
          ]
        }
      })
      /*
         1:
            great
              great => good, nice
            nice
              nice => good, great

              good => evil
              good => c
                evil => awful, bad
                c => abcd
          --:
            good => evil, c
            evil => good
              evil => awful, bad
              c => abcd
              good => nice, great, fine
                nice => great
          ==:
            great
              great => good, nice
            nice
              nice => good, great
         2:
            evil
              evil => awful, bad

              evil => good
                good => nice, great, fine, c
                  nice => great
                  c => abcd
          --:
            good => evil, c
            evil => good
              evil => awful, bad
              c => abcd
              good => nice, great, fine
                nice => great
          ==:
            evil
              evil => awful, bad
         3:
            good
              good => nice, great, fine
                nice => great

              good => evil, c
                evil => awful, bad
                c => abcd
          --:
            good => evil, c
            evil => good
              evil => awful, bad
              c => abcd
              good => nice, great, fine
                nice => great
          ==:
            good
              good => nice, great, fine
                nice => great
         4: bar(zh)
              bar(zh) => bar(jp), bar(en)
         5:
            a
              a => abcd

              a => good
                good => nice, great, fine, evil, c
                  nice => great
                  evil => awful, bad
                  c => abcd
          --:
            good => evil, c
            evil => good
            a => good
              evil => awful, bad
              c => abcd
              good => nice, great, fine
                nice => great
          ==:
            a
              a => abcd
         6: c
              c => abcd
      */
      await testTagOriginCount([
        ['1', {
          good: 2,
          great: 2,
          nice: 2,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          good: 1,
          nice: 1,
          great: 2,
          fine: 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          abcd:1,
        }],
        ['6', {
          c:1,
          abcd:1,
        }],
      ])
      await testTagCount([
        ['1', 3],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 2],
        ['6', 2],
      ])
      await globals.pluginsData.functions.deleteNullLoopTags({})
      await testTagOriginCount([
        ['1', {
          good: 2,
          great: 2,
          nice: 2,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          good: 1,
          nice: 1,
          great: 2,
          fine: 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          abcd:1,
        }],
        ['6', {
          c:1,
          abcd:1,
        }],
      ])
      await testTagCount([
        ['1', 3],
        ['2', 3], // two null loop tags (nice, great)
        ['3', 4],
        ['4', 3],
        ['5', 2], // two null loop tags (nice, great)
        ['6', 2],
      ])
      // delete some relations
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'good'},
        field: 'relations',
        data: {
          relations: [
            { __query__:{ relation: {name: 'simular'}, other: {name: 'great'}}, },
            { __query__:{ relation: {name: 'simular'}, other: {name: 'nice'}}, },
          ]
        }
      })
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'bar(en)'},
        field: 'relations',
        data: {
          relations: [
            {
              __query__:{ relation: {name: 'translation'}, other: {name: 'bar(zh)'}},
            },
          ]
        }
      })
      result = await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'abcd'},
        field: 'relations',
        data: {
          relations: [
            {
              __query__:{ relation: {name: 'disambiguation'}, to: {name: 'a'}},
            },
          ]
        }
      })
      /*
         1:
            great
              great => good, nice
            nice
              nice => good, great
           --:
            great => good
            nice => good
           ==:
            great
              great => nice
            nice
              nice => great
         2:
            evil
              evil => awful, bad
         3:
            good
              good => nice, great, fine
                nice => great
           --:
            good => nice, great
              nice => great
           ==:
            good
              good => fine
         4:
           bar(zh)
              bar(zh) => bar(jp), bar(en)
           --:
            bar(zh) => bar(en)
           ==:
            bar(zh)
              bar(zh) => bar(jp)
         5:
            a
         6: c
              c => abcd
      */
      await testTagCount([
        ['1', 2],
        ['2', 3],
        ['3', 2],
        ['4', 2],
        ['5', 1],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          great: 2,
          nice: 2,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          good: 1,
          fine: 1,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
        }],
        ['5', {
          a:1,
        }],
        ['6', {
          c:1,
          abcd:1,
        }],
      ])
      // test modify (add the deleted relations back)
      result = await globals.api({
        operation: '+',
        model: 'Tag',
        query: {name: 'good'},
        field: 'relations',
        data: {
          relations: [
            { relation: {name: 'blabla'}, other: {name: 'anyway'}},
            { relation: {name: 'blabla'}, from: {name: 'anyway2'}},
          ]
        }
      })
      result = await globals.api({
        operation: '+',
        model: 'Tag',
        query: {name: 'bar(en)'},
        field: 'relations',
        data: {
          relations: [
            { relation: {name: 'blabla'}, other: {name: 'anyway'}},
          ]
        }
      })
      result = await globals.api({
        operation: '+',
        model: 'Tag',
        query: {name: 'abcd'},
        field: 'relations',
        data: {
          relations: [
            { relation: {name: 'blabla'}, other: {name: 'anyway'} },
          ]
        }
      })
      result = await globals.api({
        operation: '*',
        model: 'Tag',
        query: {name: 'good'},
        field: 'relations',
        data: {
          relations: [
            {
              __query__:{ relation: {name: 'blabla'}, other: {name: 'anyway'}},
              relation: {name: 'simular'}, other: {name: 'great'},
            },
            {
              __query__:{ relation: {name: 'blabla'}, other: {name: 'anyway2'}},
              relation: {name: 'simular'}, other: {name: 'nice'},
            },
          ]
        }
      })
      result = await globals.api({
        operation: '*',
        model: 'Tag',
        query: {name: 'bar(en)'},
        field: 'relations',
        data: {
          relations: [
            {
              __query__:{ relation: {name: 'blabla'}, other: {name: 'anyway'}},
              relation: {name: 'translation'}, other: {name: 'bar(zh)'},
            },
          ]
        }
      })
      result = await globals.api({
        operation: '*',
        model: 'Tag',
        query: {name: 'abcd'},
        field: 'relations',
        data: {
          relations: [
            {
              __query__:{ relation: {name: 'blabla'}, other: {name: 'anyway'}},
              relation: {name: 'disambiguation'}, to: {name: 'a'},
            },
          ]
        }
      })
      /*
         1:
            great
              great => nice
            nice
              nice => great

              great => good
              nice => good
                good => fine
         2:
            evil
              evil => awful, bad
         3:
            good
              good => fine

              good => great, nice
                great => nice
         4:
            bar(zh)
              bar(zh) => bar(jp)

              bar(zh) => bar(en)
         5:
            a
              a => abcd
         6: c
              c => abcd
      */
      await testTagOriginCount([
        ['1', {
          great: 2,
          nice: 2,
          good: 2,
          fine: 1,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          good: 1,
          fine: 1,
          great: 1,
          nice: 2,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          abcd:1,
        }],
        ['6', {
          c:1,
          abcd:1,
        }],
      ])
      await testTagCount([
        ['1', 4],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 2],
        ['6', 2],
      ])
    }
    if(tname='delete Tag and Article'){
      // add more before delete tag and article
      result = await globals.api({
        operation: '+',
        model: 'Article',
        query: {title: '5'},
        field: 'tags',
        data: {
          tags: [
            { tag: {name: 'fine'}},
            { tag: {name: 'bad'}},
            { tag: {name: 'x'}},
          ]
        }
      })
      result = await globals.api({
        operation: '+',
        model: 'Article',
        query: {title: '6'},
        field: 'tags',
        data: {
          tags: [
            { tag: {name: 'fine'}},
            { tag: {name: 'bad'}},
            { tag: {name: 'x'}},
          ]
        }
      })
      /*
         5:
            a
              a => abcd
            fine
            bad
            x
              fine => good
              bad => evil
              x => xyz
                good => great, nice
                evil => awful
                  great => nice
         6: c
              c => abcd
            fine
            bad
            x
              fine => good
              bad => evil
              x => xyz
                good => great, nice
                evil => awful
                  great => nice
      */
      await testTagOriginCount([
        ['1', {
          great: 2,
          nice: 2,
          good: 2,
          fine: 1,
        }],
        ['2', {
          evil: 1,
          awful: 1,
          bad: 1,
        }],
        ['3', {
          good: 1,
          fine: 1,
          great: 1,
          nice: 2,
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          abcd:1,
          fine: 1,
          bad: 1,
          x: 1,
          good: 1,
          evil: 1,
          xyz: 1,
          nice: 2,
          great: 1,
          awful: 1,
        }],
        ['6', {
          c:1,
          abcd:1,
          fine: 1,
          bad: 1,
          x: 1,
          good: 1,
          evil: 1,
          xyz: 1,
          nice: 2,
          great: 1,
          awful: 1,
        }],
      ])
      await testTagCount([
        ['1', 4],
        ['2', 3],
        ['3', 4],
        ['4', 3],
        ['5', 11],
        ['6', 11],
      ])
      // delete Tags
      await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'good'},
      })
      await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'bad'},
      })
      await globals.api({
        operation: '-',
        model: 'Tag',
        query: {name: 'x'},
      })
      /*
         1:
            great
              great => nice
            nice
              nice => great
         2:
            evil
              evil => awful
         3:
         4:
            bar(zh)
              bar(zh) => bar(jp)

              bar(zh) => bar(en)
         5:
            a
              a => abcd
            fine
         6: c
              c => abcd
            fine
      */
      await testTagOriginCount([
        ['1', {
          great: 2,
          nice: 2,
        }],
        ['2', {
          evil: 1,
          awful: 1,
        }],
        ['3', {
        }],
        ['4', {
          'bar(zh)': 1,
          'bar(jp)': 1,
          'bar(en)': 1,
        }],
        ['5', {
          a:1,
          abcd:1,
          fine: 1,
        }],
        ['6', {
          c:1,
          abcd:1,
          fine: 1,
        }],
      ])
      await testTagCount([
        ['1', 2],
        ['2', 2],
        ['3', 0],
        ['4', 3],
        ['5', 3],
        ['6', 3],
      ])
      await globals.api({ operation: '-', model: 'Article', query: {title: '1'}, })
      await globals.api({ operation: '-', model: 'Article', query: {title: '2'}, })
      await globals.api({ operation: '-', model: 'Article', query: {title: '3'}, })
      await globals.api({ operation: '-', model: 'Article', query: {title: '4'}, })
      await globals.api({ operation: '-', model: 'Article', query: {title: '5'}, })
    }
    if(tname='turn off and delete unittest data'){
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagCount([
        ['6', 2],
      ])
      await globals.Models.Tag.deleteMany({})
      await globals.Models.Relation.deleteMany({})
      await globals.Models.Article.deleteMany({})
    }
  }
  if((tname='test hook groupRelations, AncestorTags and simularTas at the same time')) {
    if(tname='add unitttest data') {
      data = [
        {model: "Relation", data: [
          {name: 'simular', symmetric: true},
          {name: 'translation', symmetric: true},
          {name: 'disambiguation', symmetric: false},
          {name: 'blabla', symmetric: false},
        ]},
        {model: "Tag", data: [
          // test simular
          {name: 'good',
           relations: [
            {relation: {name: 'simular'}, other:{name: 'nice'}},
           ],
           fathers:[{name:'c'}]
          },
          {name: 'nice', relations: [
            {relation: {name: 'simular'}, other:{name: 'great'}},
          ]},
          {name: 'great',
           relations: [
             {relation: {name: 'simular'}, other:{name: 'fine'}},
             {relation: {name: 'translation'}, other:{name: 'foo(en)'}},
           ],
           fathers:[{name:'bar(en)'}]
          },
          {name: 'fine', fathers:[{name: 'd'}]},

          // test translation
          {name: 'foo(en)', relations:[
            {relation: {name: 'translation'}, other:{name: 'foo(zh)'}},
          ]},
          {name: 'foo(zh)', relations:[
            {relation: {name: 'translation'}, other:{name: 'foo(jp)'}},
          ]},
          {name: 'foo(jp)', relations:[
            {relation: {name: 'translation'}, other:{name: 'foo(fr)'}},
          ]},
          {name: 'foo(fr)', fathers: [{name: 'bar(fr)'}]},

          {name: 'bar(en)', relations:[
            {relation: {name: 'translation'}, other:{name: 'bar(zh)'}},
          ]},
          {name: 'bar(zh)', relations:[
            {relation: {name: 'translation'}, other:{name: 'bar(jp)'}},
          ]},
          {name: 'bar(jp)'},
          {name: 'bar(fr)'},
          {name: 'barbar(fr)', children:[{name: 'bar(fr)'}]},

          {name: 'abcd', relations:[
            {relation: {name: 'disambiguation'}, to:{name: 'a'}},
            {relation: {name: 'disambiguation'}, to:{name: 'b'}},
            {relation: {name: 'disambiguation'}, to:{name: 'c'}},
            {relation: {name: 'disambiguation'}, to:{name: 'd'}},
          ]},
          {name: 'a'}, {name: 'b'}, {name:'c'}, {name: 'd'},

          {name: 'xyz', relations:[
            {relation: {name: 'disambiguation'}, to:{name: 'x'}},
            {relation: {name: 'disambiguation'}, to:{name: 'y'}},
            {relation: {name: 'disambiguation'}, to:{name: 'z'}},
          ]},
          {name: 'x'}, {name: 'y'}, {name: 'z'},

          {name: '1', children:[{name: '1.1'},{name: '1.2'},{name: '1.3'}]},
          {name: '1.1', children:[{name:'1.1.1'}]},
          {name: '1.1.1', children:[{name:'1.1.1.1'}]},
          {name: '1.1.1.1', children:[{name:'1.1.1.1.1'}]},
          {name: '1.1.1.1.1', fathers:[{name:'1.1.1'}]},
          {name: '1.2', children:[{name:'1.2.1'},{name:'1.2.2'}]},
          {name: '1.2.1'},
          {name: '1.2.2', children:[{name:'1.2.2.1'}]},
          {name: '1.2.2.1', fathers:[{name: 'bar(fr)'}]},
          {name: '1.3', children:[{name:'1.3.1'}]},
          {name: '1.3.1', children:[{name:'1.3.1.1'},{name:'1.3.1.2'}]},
          {name: '1.3.1.1'},
          {name: '1.3.1.2', fathers:[{name: 'z'}]},
        ]},
        {model: "Article", data: [
          {title: '1', tags:[
            {tag: {name:'1.2.2.1'}},
            {tag: {name:'1.3.1'}},
            {tag: {name:'1.1.1.1.1'}},
            {tag: {name:'1.1.1'}},
            {tag:{name: 'good'}}, {tag:{name: 'great'}},
          ]},
          {title: '2', tags: [
            {tag: {name:'1.3.1.2'}},
            {tag: {name:'1.2'}},
            {tag:{name: 'fine'}},
          ]},
          {title: '3', tags: [
            {tag: {name:'1.3.1.2'}},
            {tag: {name:'1.2.2'}},
            {tag:{name: 'foo(en)'}},
          ]},
          {title: '4', tags: [
            {tag: {name:'1.1.1.1'}},
            {tag:{name: 'bar(zh)'}},
          ]},
          {title: '5', tags: [
            {tag: {name:'1.2.1'}},
            {tag: {name:'1.3.1.1'}},
            {tag:{name: 'a'}}, {tag:{name: 'b'}},
          ]},
          {title: '6', tags: [
            {tag: {name:'1.3.1.2'}},
            {tag:{name: 'x'}},
          ]},
        ]},
      ]
      await globals.bulkOP({operation: '+', data})
      /* Tags:(relations)
        good:       s|good<->nice
        nice:       s|good<->nice, s|nice<->great
        great:      s|nice<->great, s|great<->fine, t|great<->foo(en)
        fine:       s|great<->fine
        foo(en):    t|foo(en)<->foo(zh), t|great<->foo(en)
        foo(zh):    t|foo(en)<->foo(zh), t|foo(zh)<->foo(jp)
        foo(jp):    t|foo(zh)<->foo(jp), t|foo(jp)<->foo(fr),
        foo(fr):    t|foo(jp)<->foo(fr),
        bar(en):   t|bar(en)<->bar(zh)
        bar(zh):   t|bar(en)<->bar(zh), t|bar(zh)<->bar(jp)
        bar(jp):   t|bar(zh)<->bar(jp)
        bar(fr):
        barbar(fr):
        abcd:       d|abcd->a, d|abcd->b, d|abcd->c, d|abcd->d
        a:          d|abcd->a
        b:          d|abcd->b
        c:          c|abcd->c
        d:          d|abcd->d
        xyz:        d|xyz->x, d|xyz->y, d|xyz->z
        x:          d|xyz->x
        y:          d|xyz->y
        z:          d|xyz->z
      */
      await testTagRelationCount([
        ['good',      1],
        ['nice',      2],
        ['great',     3],
        ['fine',      1],
        ['foo(en)',   2],
        ['foo(zh)',   2],
        ['foo(jp)',   2],
        ['foo(fr)',   1],
        ['bar(en)',   1],
        ['bar(zh)',   2],
        ['bar(jp)',   1],
        ['bar(fr)',   0],
        ['barbar(fr)',0],
        ['abcd',      4],
        ['a',         1],
        ['b',         1],
        ['c',         1],
        ['d',         1],
        ['xyz',       3],
        ['x',         1],
        ['y',         1],
        ['z',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      /* Tags:(family)
        good:     C:  F: c
        nice:
        great:    C:  F: bar(en)
        fine:     C:  F: d
        foo(en):
        foo(zh):
        foo(jp):
        foo(fr):  C:  F: bar(fr)
        bar(en):  C: great
        bar(zh):
        bar(jp):
        bar(fr):     C: foo(fr),1.2.2.1 F: barbar(fr)
        barbar(fr):  C: bar(fr)
        abcd:
        a:
        b:
        c:        C: good, F:
        d:        C: fine, F:
        xyz:
        x:
        y:
        z:         C: 1.3.1.2, F:
        1:         C: 1.1, 1.2, 1.3 F:
        1.1;       C: 1.1.1 F: 1
        1.1.1:     C: 1.1.1.1 F:1.1
        1.1.1.1:   C: 1.1.1.1.1 F:1.1.1
        1.1.1.1.1: C: F: 1.1.1.1, 1.1.1
        1.2:       C: 1.2.1, 1.2.2, F: 1
        1.2.1:     C: F: 1.2
        1.2.2:     C: 1.2.2.1 F:1.2
        1.2.2.1:   C: F: 1.2.2, bar(fr)
        1.3:       C: 1.3.1 F: 1
        1.3.1:     C: 1.3.1.1, 1.3.1.2 F: 1.3
        1.3.1.1:   C: F: 1.3.1
        1.3.1.2:   C: F: 1.3.1, z
      */
      /* Articles:(tags)
        1: 1.2.2.1
           1.3.1
           1.1.1.1.1
           1.1.1
           good
           great
        2: 1.3.1.2
           1.2
           fine
        3: 1.3.1.2
           1.2.2
           foo(en)
        4: 1.1.1.1
           bar(zh)
        5: 1.2.1
           1.3.1.1
           a
           b
        6: 1.3.1.2
           x
      */
      await testTagCount([
        ['1', 6],
        ['2', 3],
        ['3', 3],
        ['4', 2],
        ['5', 4],
        ['6', 2],
      ])
    }
    if(1&&(tname='three hooks turn on and turn off sequence 1')) {
      component = 'hook'; componentUID = `${uid}[${component}]groupRelationTag`
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
      /* Tags:(relations)
        good:       s|good<->nice
                      => great, fine
                    (nice, great, fine)
        nice:       s|good<->nice
                    s|nice<->great
                      => fine
                    (good, great, fine)
        great:      s|nice<->great
                    s|great<->fine,
                    t|great<->foo(en)
                      => good
                      => foo(zh), foo(jp), foo(fr)
                    (nice, fine, foo(en), good, foo(zh), foo(jp), foo(fr))
        fine:       s|great<->fine
                      => good, nice
                    (great, good, nice)
        foo(en):    t|great<->foo(en)
                    t|foo(en)<->foo(zh)
                      => foo(jp), foo(fr)
                    (great, foo(zh), foo(jp), foo(fr))
        foo(zh):    t|foo(en)<->foo(zh)
                    t|foo(zh)<->foo(jp)
                      => great, foo(fr)
                    (foo(en), foo(jp), great, foo(fr))
        foo(jp):    t|foo(zh)<->foo(jp)
                    t|foo(jp)<->foo(fr),
                      => great, foo(en)
                    (foo(zh), foo(fr), great, foo(en))
        foo(fr):    t|foo(jp)<->foo(fr),
                      => great, foo(en), foo(zh)
                    (foo(jp), great, foo(en), foo(zh))
        bar(en):    t|bar(en)<->bar(zh)
                      => bar(jp)
                    (bar(zh), bar(jp))
        bar(zh):    t|bar(en)<->bar(zh)
                    t|bar(zh)<->bar(jp)
                    (bar(en), bar(jp))
        bar(jp):    t|bar(zh)<->bar(jp)
                      => bar(en)
                    (bar(zh), bar(en))
        bar(fr):
        barbar(fr):
        abcd:       d|abcd->a, d|abcd->b, d|abcd->c, d|abcd->d
        a:          d|abcd->a
        b:          d|abcd->b
        c:          c|abcd->c
        d:          d|abcd->d
        xyz:        d|xyz->x, d|xyz->y, d|xyz->z
        x:          d|xyz->x
        y:          d|xyz->y
        z:          d|xyz->z
      */
      /* Tags:(relations) simple
        good:       nice, great, fine
        nice:       good, great, fine
        great:      nice, fine, foo(en), good, foo(zh), foo(jp), foo(fr)
        fine:       great, good, nice
        foo(en):    great, foo(zh), foo(jp), foo(fr)
        foo(zh):    foo(en), foo(jp), great, foo(fr)
        foo(jp):    foo(zh), foo(fr), great, foo(en)
        foo(fr):    foo(jp), great, foo(en), foo(zh)
        bar(en):    bar(zh), bar(jp)
        bar(zh):    bar(en), bar(jp)
        bar(jp):    bar(zh), bar(en)
        bar(fr):
        barbar(fr):
        abcd:       a,b,c,d
        a:          abcd
        b:          abcd
        c:          abcd
        d:          abcd
        xyz:        xyz
        x:          x
        y:          y
        z:          z
      */
      /* Tag groups
        simular:
          * good, nice, great, fine
        translation:
          * foo(en), foo(zh), foo(jp), foo(fr), great
          * bar(en), bar(zh), bar(jp)
      */
      await testTagRelationCount([
        ['good',      3],
        ['nice',      3],
        ['great',     7],
        ['fine',      3],
        ['foo(en)',   4],
        ['foo(zh)',   4],
        ['foo(jp)',   4],
        ['foo(fr)',   4],
        ['bar(en)',   2],
        ['bar(zh)',   2],
        ['bar(jp)',   2],
        ['bar(fr)',   0],
        ['barbar(fr)',0],
        ['abcd',      4],
        ['a',         1],
        ['b',         1],
        ['c',         1],
        ['d',         1],
        ['xyz',       3],
        ['x',         1],
        ['y',         1],
        ['z',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 6],
        ['2', 3],
        ['3', 3],
        ['4', 2],
        ['5', 4],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          '1.2.2.1': 1,
          '1.3.1': 1,
          '1.1.1.1.1': 1,
          '1.1.1': 1,
          good: 1,
          great: 1,
        }],
        ['2', {
          '1.3.1.2': 1,
          '1.2': 1,
          fine: 1,
        }],
        ['3', {
          '1.3.1.2': 1,
          '1.2.2': 1,
          'foo(en)': 1,
        }],
        ['4', {
          '1.1.1.1': 1,
          'bar(zh)': 1,
        }],
        ['5', {
          '1.2.1': 1,
          '1.3.1.1': 1,
          a: 1,
          b: 1,
        }],
        ['6', {
          '1.3.1.2': 1,
          x: 1,
        }],
      ])

      component = 'hook'; componentUID = `${uid}[${component}]ancestorTags`
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
      /* Tags:(family)
        good:     C:  F: c
        nice:
        great:    C:  F: bar(en)
        fine:     C:  F: d
        foo(en):
        foo(zh):
        foo(jp):
        foo(fr):  C:  F: bar(fr)
        bar(en):  C: great
        bar(zh):
        bar(jp):
        bar(fr):     C: foo(fr),1.2.2.1 F: barbar(fr)
        barbar(fr):  C: bar(fr)
        abcd:
        a:
        b:
        c:        C: good, F:
        d:        C: fine, F:
        xyz:
        x:
        y:
        z:         C: 1.3.1.2, F:
        1:         C: 1.1, 1.2, 1.3 F:
        1.1;       C: 1.1.1 F: 1
        1.1.1:     C: 1.1.1.1 F:1.1
        1.1.1.1:   C: 1.1.1.1.1 F:1.1.1
        1.1.1.1.1: C: F: 1.1.1.1, 1.1.1
        1.2:       C: 1.2.1, 1.2.2, F: 1
        1.2.1:     C: F: 1.2
        1.2.2:     C: 1.2.2.1 F:1.2
        1.2.2.1:   C: F: 1.2.2, bar(fr)
        1.3:       C: 1.3.1 F: 1
        1.3.1:     C: 1.3.1.1, 1.3.1.2 F: 1.3
        1.3.1.1:   C: F: 1.3.1
        1.3.1.2:   C: F: 1.3.1, z
      */
      /* Articles:(tags)
        1: 1.2.2.1
           1.3.1
           1.1.1.1.1
           1.1.1
           good
           great
             1.2.2.1   => bar(fr),barbar(fr), 1.2.2, 1.2, 1
             1.3.1     => 1.3, 1
             1.1.1.1.1 => 1.1.1.1, 1.1.1, 1.1, 1
             1.1.1     => 1.1, 1
             good      => c
             great     => bar(en)
        2: 1.3.1.2
           1.2
           fine
             1.3.1.2   => z, 1.3.1, 1.3, 1
             1.2       => 1
             fine      => d
        3: 1.3.1.2
           1.2.2
           foo(en)
             1.3.1.2   => z, 1.3.1, 1.3, 1
             1.2.2     => 1.2, 1
        4: 1.1.1.1
           bar(zh)
             1.1.1.1 => 1.1.1, 1.1, 1
        5: 1.2.1
           1.3.1.1
           a
           b
             1.2.1     => 1.2, 1
             1.3.1.1   => 1.3.1, 1.3, 1
        6: 1.3.1.2
           x
             1.3.1.2   => z, 1.3.1, 1.3, 1
      */
      await testTagRelationCount([
        ['good',      3],
        ['nice',      3],
        ['great',     7],
        ['fine',      3],
        ['foo(en)',   4],
        ['foo(zh)',   4],
        ['foo(jp)',   4],
        ['foo(fr)',   4],
        ['bar(en)',   2],
        ['bar(zh)',   2],
        ['bar(jp)',   2],
        ['bar(fr)',   0],
        ['barbar(fr)',0],
        ['abcd',      4],
        ['a',         1],
        ['b',         1],
        ['c',         1],
        ['d',         1],
        ['xyz',       3],
        ['x',         1],
        ['y',         1],
        ['z',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 16],
        ['2', 8],
        ['3', 8],
        ['4', 5],
        ['5', 8],
        ['6', 6],
      ])
      await testTagOriginCount([
        ['1', {
          '1.2.2.1': 1,
          '1.3.1': 1,
          '1.1.1.1.1': 1,
          '1.1.1': 2,
          good: 1,
          great: 1,
          'bar(fr)': 1,
          'barbar(fr)': 1,
          '1.2.2': 1,
          '1.2': 1,
          '1': 4,
          '1.3': 1,
          '1.1.1.1': 1,
          '1.1': 2,
          c: 1,
          'bar(en)': 1,
        }],
        ['2', {
          '1.3.1.2': 1,
          '1.2': 1,
          fine: 1,
          z: 1,
          '1.3.1': 1,
          '1.3': 1,
          '1': 2,
          d: 1,
        }],
        ['3', {
          '1.3.1.2': 1,
          '1.2.2': 1,
          'foo(en)': 1,
          z: 1,
          '1.3.1': 1,
          '1.3': 1,
          '1': 2,
          '1.2': 1,
        }],
        ['4', {
          '1.1.1.1': 1,
          'bar(zh)': 1,
          '1.1.1': 1,
          '1.1': 1,
          '1': 1,
        }],
        ['5', {
          '1.2.1': 1,
          '1.3.1.1': 1,
          a: 1,
          b: 1,
          '1.2': 1,
          '1': 2,
          '1.3.1': 1,
          '1.3': 1,
        }],
        ['6', {
          '1.3.1.2': 1,
          x: 1,
          z: 1,
          '1.3.1': 1,
          '1.3': 1,
          '1': 1,
        }],
      ])

      component = 'hook'; componentUID = `${uid}[${component}]simularTags`
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
      /* Tags:(relations) simple
        good:       nice, great, fine
        nice:       good, great, fine
        great:      nice, fine, foo(en), good, foo(zh), foo(jp), foo(fr)
        fine:       great, good, nice
        foo(en):    great, foo(zh), foo(jp), foo(fr)
        foo(zh):    foo(en), foo(jp), great, foo(fr)
        foo(jp):    foo(zh), foo(fr), great, foo(en)
        foo(fr):    foo(jp), great, foo(en), foo(zh)
        bar(en):    bar(zh), bar(jp)
        bar(zh):    bar(en), bar(jp)
        bar(jp):    bar(zh), bar(en)
        bar(fr):
        barbar(fr):
        abcd:       a,b,c,d
        a:          abcd
        b:          abcd
        c:          abcd
        d:          abcd
        xyz:        xyz
        x:          x
        y:          y
        z:          z
      */
      /* Articles:(tags)
        1: 1.2.2.1
           1.3.1
           1.1.1.1.1
           1.1.1
           good
           great
             1.2.2.1   => bar(fr),barbar(fr), 1.2.2, 1.2, 1
             1.3.1     => 1.3, 1
             1.1.1.1.1 => 1.1.1.1, 1.1.1, 1.1, 1
             1.1.1     => 1.1, 1
             good      => c
             great     => bar(en)

             good => nice, great, fine
             great => nice, fine, foo(en), good, foo(zh), foo(jp), foo(fr)
             c => abcd
             bar(en) => bar(zh), bar(jp)
               nice => fine
               foo(en) => foo(zh), foo(jp), foo(fr)
               foo(zh) => foo(jp), foo(fr)
               foo(jp) => foo(fr)
               bar(zh) => bar(jp)
        2: 1.3.1.2
           1.2
           fine
             1.3.1.2   => z, 1.3.1, 1.3, 1
             1.2       => 1
             fine      => d

             fine => great, good, nice
             z => xyz
             d => abcd
               great => nice, foo(en), good, foo(zh), foo(jp), foo(fr)
               good => nice
                 foo(en) => foo(zh), foo(jp), foo(fr)
                 foo(zh) => foo(jp), foo(fr)
                 foo(jp) => foo(fr)
        3: 1.3.1.2
           1.2.2
           foo(en)
             1.3.1.2   => z, 1.3.1, 1.3, 1
             1.2.2     => 1.2, 1

             foo(en) => great, foo(zh), foo(jp), foo(fr)
             z => xyz
               great => nice, fine, good, foo(jp), foo(fr)
               foo(zh) => foo(jp), foo(fr)
               foo(jp) => foo(fr)
                 nice => good, fine
                 fine => good
        4: 1.1.1.1
           bar(zh)
             1.1.1.1 => 1.1.1, 1.1, 1

             bar(zh) => bar(en), bar(jp)
               bar(en) => bar(jp)
        5: 1.2.1
           1.3.1.1
           a
           b
             1.2.1     => 1.2, 1
             1.3.1.1   => 1.3.1, 1.3, 1

             a => abcd
             b => abcd
        6: 1.3.1.2
           x
             1.3.1.2   => z, 1.3.1, 1.3, 1

             x => xyz
             z => xyz
      */
      await testTagRelationCount([
        ['good',      3],
        ['nice',      3],
        ['great',     7],
        ['fine',      3],
        ['foo(en)',   4],
        ['foo(zh)',   4],
        ['foo(jp)',   4],
        ['foo(fr)',   4],
        ['bar(en)',   2],
        ['bar(zh)',   2],
        ['bar(jp)',   2],
        ['bar(fr)',   0],
        ['barbar(fr)',0],
        ['abcd',      4],
        ['a',         1],
        ['b',         1],
        ['c',         1],
        ['d',         1],
        ['xyz',       3],
        ['x',         1],
        ['y',         1],
        ['z',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagOriginCount([
        ['1', {
          '1.2.2.1': 1,
          '1.3.1': 1,
          '1.1.1.1.1': 1,
          '1.1.1': 2,
          good: 2,
          great: 2,
          'bar(fr)': 1,
          'barbar(fr)': 1,
          '1.2.2': 1,
          '1.2': 1,
          '1': 4,
          '1.3': 1,
          '1.1.1.1': 1,
          '1.1': 2,
          c: 1,
          'bar(en)': 1,

          nice:2,
          fine:3,
          'foo(en)':1,
          'foo(zh)':2,
          'foo(jp)':3,
          'foo(fr)':4,
          'abcd':1,
          'bar(zh)':1,
          'bar(jp)':2,
        }],
        ['2', {
          '1.3.1.2': 1,
          '1.2': 1,
          fine: 1,
          z: 1,
          '1.3.1': 1,
          '1.3': 1,
          '1': 2,
          d: 1,

          great:1,
          good:2,
          nice:3,
          xyz:1,
          abcd:1,
          'foo(en)':1,
          'foo(zh)':2,
          'foo(jp)':3,
          'foo(fr)':4,
        }],
        ['3', {
          '1.3.1.2': 1,
          '1.2.2': 1,
          'foo(en)': 1,
          z: 1,
          '1.3.1': 1,
          '1.3': 1,
          '1': 2,
          '1.2': 1,

          great:1,
          'foo(zh)':2,
          'foo(jp)':3,
          'foo(fr)':4,
          xyz:1,
          nice:1,
          fine:2,
          good:3,
        }],
        ['4', {
          '1.1.1.1': 1,
          'bar(zh)': 1,
          '1.1.1': 1,
          '1.1': 1,
          '1': 1,

          'bar(en)': 1,
          'bar(jp)': 2,
        }],
        ['5', {
          '1.2.1': 1,
          '1.3.1.1': 1,
          a: 1,
          b: 1,
          '1.2': 1,
          '1': 2,
          '1.3.1': 1,
          '1.3': 1,

          abcd:2
        }],
        ['6', {
          '1.3.1.2': 1,
          x: 1,
          z: 1,
          '1.3.1': 1,
          '1.3': 1,
          '1': 1,

          xyz: 2,
        }],
      ])
      await testTagCount([
        ['1', 25],
        ['2', 17], // 17
        ['3', 16],
        ['4', 7],
        ['5', 9],
        ['6', 7],
      ])

      component = 'hook'; componentUID = `${uid}[${component}]simularTags`
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagRelationCount([
        ['good',      3],
        ['nice',      3],
        ['great',     7],
        ['fine',      3],
        ['foo(en)',   4],
        ['foo(zh)',   4],
        ['foo(jp)',   4],
        ['foo(fr)',   4],
        ['bar(en)',   2],
        ['bar(zh)',   2],
        ['bar(jp)',   2],
        ['bar(fr)',   0],
        ['barbar(fr)',0],
        ['abcd',      4],
        ['a',         1],
        ['b',         1],
        ['c',         1],
        ['d',         1],
        ['xyz',       3],
        ['x',         1],
        ['y',         1],
        ['z',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 16],
        ['2', 8],
        ['3', 8],
        ['4', 5],
        ['5', 8],
        ['6', 6],
      ])
      await testTagOriginCount([
        ['1', {
          '1.2.2.1': 1,
          '1.3.1': 1,
          '1.1.1.1.1': 1,
          '1.1.1': 2,
          good: 1,
          great: 1,
          'bar(fr)': 1,
          'barbar(fr)': 1,
          '1.2.2': 1,
          '1.2': 1,
          '1': 4,
          '1.3': 1,
          '1.1.1.1': 1,
          '1.1': 2,
          c: 1,
          'bar(en)': 1,
        }],
        ['2', {
          '1.3.1.2': 1,
          '1.2': 1,
          fine: 1,
          z: 1,
          '1.3.1': 1,
          '1.3': 1,
          '1': 2,
          d: 1,
        }],
        ['3', {
          '1.3.1.2': 1,
          '1.2.2': 1,
          'foo(en)': 1,
          z: 1,
          '1.3.1': 1,
          '1.3': 1,
          '1': 2,
          '1.2': 1,
        }],
        ['4', {
          '1.1.1.1': 1,
          'bar(zh)': 1,
          '1.1.1': 1,
          '1.1': 1,
          '1': 1,
        }],
        ['5', {
          '1.2.1': 1,
          '1.3.1.1': 1,
          a: 1,
          b: 1,
          '1.2': 1,
          '1': 2,
          '1.3.1': 1,
          '1.3': 1,
        }],
        ['6', {
          '1.3.1.2': 1,
          x: 1,
          z: 1,
          '1.3.1': 1,
          '1.3': 1,
          '1': 1,
        }],
      ])

      component = 'hook'; componentUID = `${uid}[${component}]ancestorTags`
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagRelationCount([
        ['good',      3],
        ['nice',      3],
        ['great',     7],
        ['fine',      3],
        ['foo(en)',   4],
        ['foo(zh)',   4],
        ['foo(jp)',   4],
        ['foo(fr)',   4],
        ['bar(en)',   2],
        ['bar(zh)',   2],
        ['bar(jp)',   2],
        ['bar(fr)',   0],
        ['barbar(fr)',0],
        ['abcd',      4],
        ['a',         1],
        ['b',         1],
        ['c',         1],
        ['d',         1],
        ['xyz',       3],
        ['x',         1],
        ['y',         1],
        ['z',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 6],
        ['2', 3],
        ['3', 3],
        ['4', 2],
        ['5', 4],
        ['6', 2],
      ])
      await testTagOriginCount([
        ['1', {
          '1.2.2.1': 1,
          '1.3.1': 1,
          '1.1.1.1.1': 1,
          '1.1.1': 1,
          good: 1,
          great: 1,
        }],
        ['2', {
          '1.3.1.2': 1,
          '1.2': 1,
          fine: 1,
        }],
        ['3', {
          '1.3.1.2': 1,
          '1.2.2': 1,
          'foo(en)': 1,
        }],
        ['4', {
          '1.1.1.1': 1,
          'bar(zh)': 1,
        }],
        ['5', {
          '1.2.1': 1,
          '1.3.1.1': 1,
          a: 1,
          b: 1,
        }],
        ['6', {
          '1.3.1.2': 1,
          x: 1,
        }],
      ])

      component = 'hook'; componentUID = `${uid}[${component}]groupRelationTag`
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagRelationCount([
        ['good',      1],
        ['nice',      2],
        ['great',     3],
        ['fine',      1],
        ['foo(en)',   2],
        ['foo(zh)',   2],
        ['foo(jp)',   2],
        ['foo(fr)',   1],
        ['bar(en)',   1],
        ['bar(zh)',   2],
        ['bar(jp)',   1],
        ['bar(fr)',   0],
        ['barbar(fr)',0],
        ['abcd',      4],
        ['a',         1],
        ['b',         1],
        ['c',         1],
        ['d',         1],
        ['xyz',       3],
        ['x',         1],
        ['y',         1],
        ['z',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 6],
        ['2', 3],
        ['3', 3],
        ['4', 2],
        ['5', 4],
        ['6', 2],
      ])
    }
    return
    if(1&&(tname='three hooks turn on and turn off sequence 2')) {
      // use different order
      component = 'hook'; componentUID = `${uid}[${component}]simularTags`
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
      /* Articles:(tags)
        1: 1.2.2.1
           1.3.1
           1.1.1.1.1
           1.1.1
           good
           great => fine
             good => nice
             great => fine
               nice =>
        2: 1.3.1.2
           1.2
           fine => great
        3: 1.3.1.2
           1.2.2
           foo(en) => foo(zh)
        4: 1.1.1.1
           bar(zh) => bar(en), bar(jp)
        5: 1.2.1
           1.3.1.1
           a => abcd
           b
        6: 1.3.1.1
           x => xyz
      */
      await testTagRelationCount([
        ['good',      1],
        ['nice',      2],
        ['great',     2],
        ['fine',      1],
        ['foo(en)',   1],
        ['foo(zh)',   2],
        ['foo(jp)',   2],
        ['foo(fr)',   1],
        ['bar(en)',   1],
        ['bar(zh)',   2],
        ['bar(jp)',   1],
        ['bar(fr)',   0],
        ['abcd',      2],
        ['a',         1],
        ['b',         1],
        ['xyz',       2],
        ['x',         1],
        ['y',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 8],
        ['2', 4],
        ['3', 4],
        ['4', 4],
        ['5', 5],
        ['6', 3],
      ])
      return
      component = 'hook'; componentUID = `${uid}[${component}]groupRelationTag`
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
      /* Tags:(relations)
        good:       s|good<->nice
                    great, fine
        nice:       s|good<->nice, s|nice<->great
                    fine
        great:      s|nice<->great, s|great<->fine
                    good
        fine:       s|great<->fine
                    good, nice
        foo(en):    t|foo(en)<->foo(zh)
                    foo(jp), foo(fr)
        foo(zh):    t|foo(en)<->foo(zh), t|foo(zh)<->foo(jp)
                    foo(fr)
        foo(jp):    t|foo(zh)<->foo(jp), t|foo(jp)<->foo(fr),
                    foo(en)
        foo(fr):    t|foo(jp)<->foo(fr),
                    foo(en), foo(zh)
        bar(en):    t|bar(en)<->bar(zh)
                    bar(jp)
        bar(zh):    t|bar(en)<->bar(zh), t|bar(zh)<->bar(jp)
        bar(jp):    t|bar(zh)<->bar(jp)
                    bar(en)
        bar(fr):
        abcd:       d|abcd->a, d|abcd->b
        a:          d|abcd->a
        b:          d|abcd->b
        xyz:        d|xyz->x, d|xyz->y
        x:          d|xyz->x
        y:          d|xyz->y
        1:
        1.1;
        1.1.1:
        1.1.1.1:
        1.1.1.1.1:
        1.2:
        1.2.1:
        1.2.2:
        1.2.2.1:
        1.3:
        1.3.1:
        1.3.1.1:
        1.3.1.2:
      */
      /* Articles:(tags)
        1: 1.2.2.1
           1.3.1
           1.1.1.1.1
           1.1.1
           good => nice
           great => fine
        2: 1.3.1.2
           1.2
           fine => great, nice, good
        3: 1.3.1.2
           1.2.2
           foo(en) => foo(zh), foo(jp), foo(fr)
        4: 1.1.1.1
           bar(zh) => bar(en), bar(jp)
        5: 1.2.1
           1.3.1.1
           a => abcd
           b
        6: 1.3.1.1
           x => xyz
      */
      await testTagRelationCount([
        ['good',      3],
        ['nice',      3],
        ['great',     3],
        ['fine',      3],
        ['foo(en)',   3],
        ['foo(zh)',   3],
        ['foo(jp)',   3],
        ['foo(fr)',   3],
        ['bar(en)',   2],
        ['bar(zh)',   2],
        ['bar(jp)',   2],
        ['bar(fr)',   0],
        ['abcd',      2],
        ['a',         1],
        ['b',         1],
        ['xyz',       2],
        ['x',         1],
        ['y',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 8],
        ['2', 6],
        ['3', 6],
        ['4', 4],
        ['5', 5],
        ['6', 3],
      ])
      component = 'hook'; componentUID = `${uid}[${component}]ancestorTags`
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
      await testTagRelationCount([
        ['good',      3],
        ['nice',      3],
        ['great',     3],
        ['fine',      3],
        ['foo(en)',   3],
        ['foo(zh)',   3],
        ['foo(jp)',   3],
        ['foo(fr)',   3],
        ['bar(en)',   2],
        ['bar(zh)',   2],
        ['bar(jp)',   2],
        ['bar(fr)',   0],
        ['abcd',      2],
        ['a',         1],
        ['b',         1],
        ['xyz',       2],
        ['x',         1],
        ['y',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 14],
        ['2', 9],
        ['3', 10],
        ['4', 7],
        ['5', 9],
        ['6', 6],
      ])

      component = 'hook'; componentUID = `${uid}[${component}]ancestorTags`
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagRelationCount([
        ['good',      3],
        ['nice',      3],
        ['great',     3],
        ['fine',      3],
        ['foo(en)',   3],
        ['foo(zh)',   3],
        ['foo(jp)',   3],
        ['foo(fr)',   3],
        ['bar(en)',   2],
        ['bar(zh)',   2],
        ['bar(jp)',   2],
        ['bar(fr)',   0],
        ['abcd',      2],
        ['a',         1],
        ['b',         1],
        ['xyz',       2],
        ['x',         1],
        ['y',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 8],
        ['2', 6],
        ['3', 6],
        ['4', 4],
        ['5', 5],
        ['6', 3],
      ])
      /* Tags:(relations)
        good:       s|good<->nice
                    great, fine
        nice:       s|good<->nice, s|nice<->great
                    fine
        great:      s|nice<->great, s|great<->fine
                    good
        fine:       s|great<->fine
                    good, nice
        foo(en):    t|foo(en)<->foo(zh)
                    foo(jp), foo(fr)
        foo(zh):    t|foo(en)<->foo(zh), t|foo(zh)<->foo(jp)
                    foo(fr)
        foo(jp):    t|foo(zh)<->foo(jp), t|foo(jp)<->foo(fr),
                    foo(en)
        foo(fr):    t|foo(jp)<->foo(fr),
                    foo(en), foo(zh)
        bar(en):    t|bar(en)<->bar(zh)
                    bar(jp)
        bar(zh):    t|bar(en)<->bar(zh), t|bar(zh)<->bar(jp)
        bar(jp):    t|bar(zh)<->bar(jp)
                    bar(en)
        bar(fr):
        abcd:       d|abcd->a, d|abcd->b
        a:          d|abcd->a
        b:          d|abcd->b
        xyz:        d|xyz->x, d|xyz->y
        x:          d|xyz->x
        y:          d|xyz->y
        1:
        1.1;
        1.1.1:
        1.1.1.1:
        1.1.1.1.1:
        1.2:
        1.2.1:
        1.2.2:
        1.2.2.1:
        1.3:
        1.3.1:
        1.3.1.1:
        1.3.1.2:
      */
      /* Articles:(tags)
        1: 1.2.2.1
           1.3.1
           1.1.1.1.1
           1.1.1
           good => nice
           great => fine
        2: 1.3.1.2
           1.2
           fine => great, nice, good
        3: 1.3.1.2
           1.2.2
           foo(en) => foo(zh), foo(jp), foo(fr)
        4: 1.1.1.1
           bar(zh) => bar(en), bar(jp)
        5: 1.2.1
           1.3.1.1
           a => abcd
           b
        6: 1.3.1.1
           x => xyz
      */
      component = 'hook'; componentUID = `${uid}[${component}]groupRelationTag`
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagRelationCount([
        ['good',      1],
        ['nice',      2],
        ['great',     2],
        ['fine',      1],
        ['foo(en)',   1],
        ['foo(zh)',   2],
        ['foo(jp)',   2],
        ['foo(fr)',   1],
        ['bar(en)',   1],
        ['bar(zh)',   2],
        ['bar(jp)',   1],
        ['bar(fr)',   0],
        ['abcd',      2],
        ['a',         1],
        ['b',         1],
        ['xyz',       2],
        ['x',         1],
        ['y',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 8],
        ['2', 4],
        ['3', 4],
        ['4', 4],
        ['5', 5],
        ['6', 3],
      ])
      component = 'hook'; componentUID = `${uid}[${component}]simularTags`
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await testTagRelationCount([
        ['good',      1],
        ['nice',      2],
        ['great',     2],
        ['fine',      1],
        ['foo(en)',   1],
        ['foo(zh)',   2],
        ['foo(jp)',   2],
        ['foo(fr)',   1],
        ['bar(en)',   1],
        ['bar(zh)',   2],
        ['bar(jp)',   1],
        ['bar(fr)',   0],
        ['abcd',      2],
        ['a',         1],
        ['b',         1],
        ['xyz',       2],
        ['x',         1],
        ['y',         1],
        ['1',         0],
        ['1.1',       0],
        ['1.1.1',     0],
        ['1.1.1.1',   0],
        ['1.1.1.1.1', 0],
        ['1.2',       0],
        ['1.2.1',     0],
        ['1.2.2',     0],
        ['1.2.2.1',   0],
        ['1.3',       0],
        ['1.3.1',     0],
        ['1.3.1.1',   0],
        ['1.3.1.2',   0],
      ])
      await testTagCount([
        ['1', 6],
        ['2', 3],
        ['3', 3],
        ['4', 2],
        ['5', 4],
        ['6', 2],
      ])
    }
  }
  t.pass()
})
