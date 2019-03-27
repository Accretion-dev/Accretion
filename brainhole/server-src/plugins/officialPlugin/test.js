// because the ava test package DO NOT have a global 'before' and 'after' hook
// i had to concat all test scripts into test-final.js
// see test-final.js for all the imports
test.serial('Plugin: officialPlugin', async t => {
  let tname, result, refetch
  async function testData({r, componentUID, op}) {
    for (let each of r.data) {
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
      if (!obj) t.fail(`Article name ${data[0]} not exists`)
      datacal.push([data[0], obj.tags.length])
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
    await testData({r, componentUID, op:'on'})
    r = await globals.pluginAPI({operation:'off', uid, component, componentUID})
    await testData({r, componentUID, op:'off'})
  }
  if(0&&(tname='test hook groupRelations')) {
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
            {relation: {name: 'translation'}, from:{name: 'bar(jp)'}},
          ]},
          {name: 'bar(jp)'},
          {name: 'bar(fr)'},

          {name: 'ha(en)', relations:[
            {relation: {name: 'translation'}, from:{name: 'ha(zh)'}},
            {relation: {name: 'translation'}, from:{name: 'ha(jp)'}},
            {relation: {name: 'translation'}, from:{name: 'ha(fr)'}},
          ]},
          {name: 'ha(zh)'},
          {name: 'ha(jp)'},
          {name: 'ha(fr)'},

        ]},
      ]
      await globals.bulkOP({operation: '+', data})
    }
    if(tname='turn on and off'){
      result = await globals.pluginAPI({operation:'on', uid, component, componentUID})
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
        ['bar(zh)', 2,],
        ['bar(jp)', 2,],
        ['bar(fr)', 1,],
        ['ha(zh)', 0,],
        ['ha(jp)', 0,],
        ['ha(fr)', 0,],
      ])
      await globals.Models.Tag.deleteMany({})
      await globals.Models.Relation.deleteMany({})
    }
  }
  if(tname='test hook addAncesotrTags') {
    component = 'hook'
    componentUID = `${uid}[${component}]addAncestorTags`
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
      //    1.1.1.1, 1.1.1.1, 1.1.1, 1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1, 3.2, 3
      //    2.2, 2
      // 3: 3.2, 3
      //    1.3.1.2, 1.3.1, 1.3, 1,
      // 4: 1.1.1.1, 1.1.1, 1.1, 1, 3.2, 3
      // 5: 1.2.1, 1.2, 1, 1.3.1.1, 1.3.1, 1.3
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
      //    1.1.1.1, 1.1.1.1, 1.1.1, 1.1
      // 2: 1.3.1.2, 1.3.1, 1.3, 1, 3.2, 3
      //    2.2, 2
      // 3: 3.2, 3
      //    1.3.1.2, 1.3.1, 1.3, 1,
      // 4: 1.1.1.1, 1.1.1, 1.1, 1
      // 5: 1.2.1, 1.2, 1, 1.3.1.1, 1.3.1, 1.3
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
      //    1.1.1.1, 1.1.1.1, 1.1.1, 1.1
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
      // 1: 1.2.2.1, 1.2.2, 1.2, 1
      //    1.3.1, 1.3,
      //    1.1.1.1, 1.1.1.1, 1.1.1, 1.1
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
        ['3', 0],
        ['4', 4],
      ])
    }
    if(tname='add and delete tag family, refresh all related entries'){
    }
    if(tname='turn off and delete unittest data'){
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
    if(tname='turn on and turn off'){
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
      await globals.pluginAPI({operation:'off', uid, component, componentUID})
      await globals.pluginAPI({operation:'on', uid, component, componentUID})
    }
    if(tname='test delete the related relations, throw errors'){
    }
    if(tname='add and delete by field'){

    }
    if(tname='modify with field, raise error'){

    }
    if(tname='add and delete tag relation, refresh all related entries'){

    }
  }
  if(tname='test hook ambiguousTags') {
    if(tname='add unitttest data') {
    }
    if(tname='turn on and turn off'){
    }

    if('turn off and delete unittest data'){
    }
  }
  t.pass()
})
