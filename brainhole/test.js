import debugSettings from './server/debug-settings-test'
import globalConfig from "./configs/config.js"
import _ from 'lodash'
import yaml from 'node-yaml'
let config = require('./nuxt.config.js')
let databaseConfig = yaml.readSync('../configs/mongod.yml')
import database_init from './server/models'
import __ from './server/models/models'
const {Models, api, WithsDict, All} = __
import test from 'ava'

if (globalConfig.database !== 'test') {
  throw Error(`you can only run unittest on test database!`)
}

function getRequire (Model) {
  let tree = Model.schema.tree
  let fields = Object.keys(tree)
  let good = fields.filter(_ => tree[_].required)
  return good
}

test.before('init database', async t => {
  globalConfig.demoData = false
  globalConfig.unittest = true
  await database_init({config: globalConfig, databaseConfig})
  t.pass()
})

test('basic', async t => { // create, modify and delete for All model
  for (let each of All) {
    let Model = Models[each]
    let pks = getRequire(Model)
    let data, refetch, refetch_, result
    data = {
      comment: `${each} basic test`,
    }
    if (pks.length) {
      for (let pk of pks) {
        data[pk] = `${each} basic test`
      }
    }
    // create
    result = await api({
      operation: '+',
      data,
      model: each
    })
    let id = result.modelID
    refetch = (await Model.findOne({id}))._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    // modify
    data = {
      comment: `${each} basic modified`
    }
    result = await api({
      operation: '*',
      data,
      model: each,
      query: {id}
    })
    refetch = (await Model.findOne({id}))._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    // delete
    result = await api({
      operation: '-',
      model: each,
      query: {id}
    })
    refetch = await Model.findOne({id})
    t.true(refetch === null)
  }
  t.pass()
})
test('flags', async t => {
  let todos = WithsDict.WithFlag
  for (let each of todos) {
    let Model = Models[each]
    let pks = getRequire(Model)
    let data, refetch, refetch_, result, id, flags
    // generate data with all requirements
    data = {
      comment: `${each} ${t.title} test`,
    }
    if (pks.length) {
      for (let pk of pks) {
        data[pk] = `${each} ${t.title} test pks`
      }
    }
    flags = { debug: true, in_trush: true, }

    if("create, modify with data.flags"){
      // create with flag
      data.flags = flags
      result = await api({
        operation: '+',
        data,
        model: each
      })
      id = result.modelID
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch, data)
      t.deepEqual(refetch, refetch_) // test add with flags
      // modify both simple and withs
      data.comment = `${each} ${t.title} modified`
      data.flags.in_trush = false
      data.flags.ddebug = true
      result = await api({
        operation: '*',
        data,
        model: each,
        query: {id}
      })
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch, data)
      t.deepEqual(refetch, refetch_) // test add with flgas and simple
    }
    if("create without flags, then add/modify/delete using the 'flags' field"){
      // create without flags
      delete data.flags
      result = await api({
        operation: '+',
        data,
        model: each
      })
      id = result.modelID
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch, data)
      t.deepEqual(refetch, refetch_)

      // add flags with 'flags' field
      result = await api({
        operation: '+',
        data: {flags},
        model: each,
        query: {id},
        field: 'flags',
      })
      refetch = (await Model.findOne({id}))._doc
      t.deepEqual(refetch.flags, flags) // test add flag with 'flags' field
      // modify flags with 'flags' field
      flags.in_trush = 3
      flags.debug = 4
      flags.debugg = 5
      result = await api({
        operation: '*',
        data:{flags},
        model: each,
        query: {id},
        field: 'flags'
      })
      refetch = (await Model.findOne({id}))._doc
      t.deepEqual(refetch.flags, flags) // test flags modify
      // delete with 'flags' field
      let toDelete = {in_trush: true, debug: true}
      for (let name of Object.keys(toDelete)) {
        delete flags[name]
      }
      result = await api({
        operation: '-',
        data: {flags: toDelete},
        model: each,
        query: {id},
        field: 'flags'
      })
      refetch = (await Model.findOne({id}))._doc
      t.deepEqual(refetch.flags, flags) // test flags delete
      // clean up, delete this entry
      result = await api({
        operation: '-',
        model: each,
        query: {id}
      })
      refetch = await Model.findOne({id})
      t.true(refetch === null)
    }
  }
  t.pass()
})
test('metadatas+flags', async t => {
  // init Metadatas
  let Metadatas = [
    {name: t.title + '-rate', format: 'string'},
    {name: t.title + '-color', format: 'color'},
    {name: t.title + '-count', format: 'number'},
    {name: t.title + '-object', format: 'object'},
    {name: t.title + '-object2', format: 'object'},
  ]
  for (let each of Metadatas) {
    let result = await api({
      operation: '+',
      data: each,
      model: "Metadata"
    })
    let id = result.modelID
    each.id = id
  }

  // begin test
  let todos = WithsDict.WithMetadata
  for (let each of todos) {
    async function testMetadataCount(array) {
      let counts = []
      for (let metadata of Metadatas) {
        let eachMetadata = (await Models.Metadata.findOne({id: metadata.id}))._doc
        counts.push(eachMetadata.r[each].length)
      }
      // console.log(array, counts)
      t.deepEqual(array, counts)
    }
    let Model = Models[each]
    let pks = getRequire(Model)
    let data, refetch, refetch_, result, id, updated, metadatas, copy, newmetadatas, rawdata, toDelete
    data = {
      comment: `${each} ${t.title} test`,
      flags: {
        init_flags: true
      }
    }
    if (pks.length) {
      for (let pk of pks) {
        data[pk] = `${each} ${t.title} test`
      }
    }

    rawdata = Object.assign({}, data)
    metadatas = [
      {
        metadata_id: Metadatas[0].id,
        value: 'test rate string'
      },
      {
        metadata_id: Metadatas[1].id,
        value: 'test color string',
        comment: 'test comment'
      },
      {
        metadata_id: Metadatas[2].id,
        value: 233,
        comment: 'test comment'
      },
      {
        metadata_id: Metadatas[3].id,
        value: {msg: 'object value'},
        comment: 'test comment',
        flags: {debug: true, test: false, ttest: false}
      },
      {
        metadata: {
          name: t.title + '-rate' // [0]
        },
        value: 'test rate string 2',
        flags: {debug: true, test:null, ttest: false}
      },
      {
        metadata: {
          id: Metadatas[1].id
        },
        value: 'test color string 2',
        flags: {debug: true, test:null, ttest: false}
      },
    ]
    copy = metadatas.map(_ => Object.assign({}, _))

    if("create, modify with data.metadatas") {
      // create with data.metadatas
      data.metadatas = metadatas
      result = await api({
        operation: '+',
        data,
        model: each
      })
      t.deepEqual(metadatas, copy) // not change metadatas inside the api
      id = result.modelID
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch)
      for (let index in updated) { // repleace all withs data
        Object.assign(refetch_.metadatas[index], metadatas[index])
      }
      Object.assign(refetch_, rawdata) // repleace all simple data
      t.deepEqual(refetch, refetch_)
      await testMetadataCount([2,2,1,1,0])

      // modify both simple and withs (flags and metadatas)
      updated = result.withs.metadatas // have id in each metadata
      data.comment = `${each} ${t.title} modified`
      data.flags.in_trush = false
      data.flags.ddebug = true
      newmetadatas = [ // old [0] and [1] have two value
        { // [1]
          id: updated[1].id, // have two value, must use id to search
          value: 'test color string updated',
          comment: 'test comment updated',
          flags: {
            add_new_flag: true
          },
        },
        { // [3] => [4] only this one can modify with name, others have dupoicated term
          metadata: {
            name: t.title + '-object2'
          },
          __query__: {
            metadata: {
              name: t.title + '-object'
            },
          },
          value: {msg: 'mixed_value modify', mixed_value_add: true},
          comment: 'update comment',
          flags: {debug: 'change to false'}
        },
        { // [2]
          __query__: {
            metadata_id: updated[2].metadata_id,
          },
          value: 'test rate string 2 modified',
          comment: 'new comment',
          flags: {debug: 'change to false', add_new_flag: true}
        },
      ]
      data.metadatas = newmetadatas // only modify these metadatas
      result = await api({
        operation: '*',
        data,
        model: each,
        query: {id}
      })
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch)
      Object.assign(refetch_, _.omit(data, ['metadatas'])) // replace simple
      updated = newmetadatas.map(__ => _.omit(__, ['__query__']) )
      Object.assign(refetch_.metadatas[1], updated[0])
      Object.assign(refetch_.metadatas[3], updated[1])
      Object.assign(refetch_.metadatas[2], updated[2])
      t.deepEqual(refetch, refetch_)
      await testMetadataCount([2,2,1,0,1])

      // delete it
      result = await api({
        operation: '-',
        model: each,
        query: {id}
      })
      refetch = await Model.findOne({id})
      t.true(refetch === null)
      await testMetadataCount([0,0,0,0,0])
    }
    if("add, modify, delete and reorder metadatas with field"){
      // create with no metadatas
      delete data.metadatas
      result = await api({
        operation: '+',
        data,
        model: each
      })
      id = result.modelID
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch, data)
      t.deepEqual(refetch, refetch_)
      await testMetadataCount([0,0,0,0,0])

      // add metadatas with field
      result = await api({
        operation: '+',
        data: { metadatas: copy },
        model: each,
        query: {id},
        field: 'metadatas',
      })
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch)
      updated = result.withs.metadatas
      for (let index in updated) {
        Object.assign(refetch_.metadatas[index], updated[index])
      }
      t.deepEqual(refetch, refetch_)
      await testMetadataCount([2,2,1,1,0])

      // modify with fields
      updated = result.withs.metadatas
      newmetadatas = [ // the same modify as the first test
        { // [1], have two value
          id: updated[0].id,
          value: 'test color string updated with field',
          comment: 'test comment updated with field',
          flags: {
            add_new_flag: true, update_with_field: true
          }
        },
        { // [3] only this one can modify with name, others have duplicated term
          metadata: {
            name: t.title + '-object2'
          },
          __query__: {
            metadata: {
              name: t.title + '-object'
            },
          },
          value: {msg: 'mwf', mixed_value_add: false, modify_with_field: true},
          comment: 'test comment modified with field',
          flags: {debug: 'change to false with field'}
        },
        { // [2]
          __query__: {
            metadata_id: updated[2].metadata_id,
          },
          value: 'test rate string 2 modified with field',
          comment: 'new comment modified with field',
          flags: {debug: 'modify to blabla', add_new_flag: false, modify_with_field: true}
        },
      ]
      result = await api({
        operation: '*',
        data: {metadatas: newmetadatas},
        model: each,
        query: {id},
        field: 'metadatas'
      })
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch)
      Object.assign(refetch_, _.omit(data, ['metadatas'])) // replace simple field
      updated = newmetadatas.map(__ => _.omit(__, ['__query__']) )
      Object.assign(refetch_.metadatas[1], updated[0])
      Object.assign(refetch_.metadatas[3], updated[1])
      Object.assign(refetch_.metadatas[2], updated[2])
      t.deepEqual(refetch, refetch_)
      await testMetadataCount([2,2,1,0,1])

      // delete metadata only
      updated = result.withs.metadatas
      toDelete = [
        { // [1]
          id: updated[0].id,
        },
        { // [3] only this one can modify with name, others have duplicated term
          __query__: {
            metadata: {
              name: t.title + '-object2'
            },
          },
        },
        { // [2]
          __query__: {
            metadata_id: updated[2].metadata_id,
          },
        },
      ]
      result = await api({
        operation: '-',
        data: {metadatas: toDelete},
        model: each,
        query: {id},
        field: 'metadatas'
      })
      refetch = (await Model.findOne({id}))._doc.metadatas
      let ids = updated.map(_=>_.id)
      refetch_ = refetch.filter(_ => ids.includes(_.id))
      t.is(refetch_.length, 0)
      await testMetadataCount([1,2,0,0,0])

      // test reorder
      ids = refetch.map(_ => ({id: _.id}))
      let newIDs = [ids[0], ids[2], ids[1]]
      result = await api({
        operation: 'o',
        data: {metadatas: newIDs},
        model: each,
        query: {id},
        field: 'metadatas'
      })
      refetch = (await Model.findOne({id}))._doc.metadatas
      let refetchIDs = Array.from(refetch).map(_ => ({id: _.id}))
      t.deepEqual(newIDs, refetchIDs)
      await testMetadataCount([1,2,0,0,0])
    }
    if("add, modify and delete metadatas.flags with field"){
      /* now we have three metadatas: [
        {[2]},
        {[2]},
        {[1]},
      ], only the later two have flags*/
      // add flags in metadata
      let newData = [
        {id: refetch[0].id, flags: {add_by_field_flag: true}},
        {id: refetch[1].id, flags: {add_by_field_flag: true}},
      ]
      result = await api({
        operation: '+',
        data: {metadatas: newData},
        model: each,
        query: {id},
        field: 'metadatas.flags'
      })
      refetch = (await Model.findOne({id}))._doc.metadatas
      t.is(newData[0].flags.add_by_field_flag, refetch[0].flags.add_by_field_flag)
      t.is(newData[1].flags.add_by_field_flag, refetch[1].flags.add_by_field_flag)
      await testMetadataCount([1,2,0,0,0])

      // modify flags in metadata
      let toModify = refetch.map(__ => _.pick(__, ["id", "flags"])) // old metadatas
      toModify = toModify.slice(1,) // only the later two have flags
      toModify[0].flags.debug = 'hahaha'
      toModify[1].flags.debug = 'lalala'
      toModify[1].flags.ddebug = 'huhuhu'
      result = await api({
        operation: '*',
        data: {metadatas: toModify},
        model: each,
        query: {id},
        field: 'metadatas.flags'
      })
      refetch = await Model.findOne({id})
      refetch = refetch._doc.metadatas
      refetch = refetch.slice(1,)
      t.is( refetch[0].flags.debug, toModify[0].flags.debug )
      t.is( refetch[0].flags.debug, toModify[0].flags.debug )
      t.is( refetch[1].flags.ddebug, toModify[1].flags.ddebug )
      refetch = await Model.findOne({id})
      refetch = refetch._doc.metadatas
      await testMetadataCount([1,2,0,0,0])

      // delete flags in metadata
      toDelete = refetch.map(__ => _.pick(__, ["id", "flags"]))
      toDelete = toDelete.slice(1,) // only the later two have flags
      rawdata = toDelete[0].flags.debug
      delete toDelete[0].flags.debug // do not delete first
      result = await api({
        operation: '-',
        data: {metadatas: toDelete},
        model: each,
        query: {id},
        field: 'metadatas.flags'
      })
      refetch = await Model.findOne({id})
      refetch = refetch._doc.metadatas
      refetch = refetch.slice(1,)
      for (let index in refetch) {
        let inter = _.intersection(
          Object.keys(refetch[index].flags),
          Object.keys(toDelete[index].flags)
        )
        t.is(inter.length, 0)
      }
      t.is(refetch[0].flags.debug, rawdata)
      await testMetadataCount([1,2,0,0,0])

      // delete the entry, clean up
      let oldresult = result
      result = await api({
        operation: '-',
        model: each,
        query: {id}
      })
      refetch = await Model.findOne({id})
      t.true(refetch === null)
      await testMetadataCount([0,0,0,0,0])
    }
  }

  // delete Metadatas
  for (let each of Metadatas) {
    let id = each.id
    let result = await api({
      operation: '-',
      query: {id},
      model: "Metadata"
    })
    let refetch = await Models.Metadata.findOne({id})
    t.true(refetch === null)
  }
  t.pass()
})
test('relations+flags', async t => {
  // init relations
  let testWiths = "relations"
  let Relations = [
    {name: t.title + '-larger',  symmetric: false},
    {name: t.title + '-smaller', symmetric: false},
    {name: t.title + '-simular', symmetric: true},
    {name: t.title + '-different', symmetric: true},
    {name: t.title + '-classmate', symmetric: true, type: 'group', hook: 'group'},
    {name: t.title + '-same_author', symmetric: true, type: 'group', hook: 'group'},
    {name: t.title + '-same', symmetric: true, hook: 'same', onlyFor: ['Tag']},
    {name: t.title + '-same2', symmetric: true, hook: 'same', onlyFor: ['Tag']},
    {name: t.title + '-CN2EN', symmetric: false, type: 'translation'},
    {name: t.title + '-CN2JP', symmetric: false, type: 'translation'},
  ]
  let R = {}
  for (let each of Relations) {
    let result = await api({
      operation: '+',
      data: each,
      model: "Relation"
    })
    let id = result.modelID
    each.id = id
    let namesplits = each.name.split('-')
    let name = namesplits[namesplits.length - 1]
    R[name] = each
  }
  // begin test
  let todos = WithsDict.WithRelation
  for (let each of todos) {
    async function testRelationCount(array) {
      let counts = []
      for (let relation of Relations) {
        let eachRelation = (await Models.Relation.findOne({id: relation.id}))._doc
        counts.push(eachRelation.r[each].length)
      }
      // console.log(array, counts)
      t.deepEqual(array, counts, JSON.stringify({array, counts}))
    }
    async function testRelationConsistent(result) {
      for (let relation of result.relations) {
        let this_sub_entry = relation
        let that_sub_entry = Object.assign({}, relation._doc)
        if (this_sub_entry.aorb==='a') {
          that_sub_entry.other_id = this_sub_entry.from_id
          that_sub_entry.other_model = this_sub_entry.from_model
          that_sub_entry.aorb = 'b'
        } else if (this_sub_entry.aorb==='b') {
          that_sub_entry.other_id = this_sub_entry.to_id
          that_sub_entry.other_model = this_sub_entry.to_model
          that_sub_entry.aorb = 'a'
        } else {
            throw Error(`aorb is not a or b, ${JSON.stringify(this_sub_entry)}`)
        }
        let other_entry = await Models[relation.other_model].find({id: relation.other_id})
        t.is(other_entry.length, 1)
        other_entry = other_entry[0]
        let other_that_sub_entry = other_entry.relations.find(_ => _.id===that_sub_entry.id)
        t.true(!!other_that_sub_entry, JSON.stringify({this_sub_entry, that_sub_entry, other_that_sub_entry},null,2))
        other_that_sub_entry = other_that_sub_entry._doc
        t.deepEqual(other_that_sub_entry, that_sub_entry, JSON.stringify({this_sub_entry, that_sub_entry, other_that_sub_entry},null,2))
      }
    }
    let Model = Models[each]
    let pks = getRequire(Model)
    let data, refetch, refetch_, result, id, updated, relations, copy, newrelations, toDelete, rawdata
    let D = []
    for (let i=0; i<=10; i++) {
      data = {
        comment: `${i} ${each} ${t.title} test`,
        flags: {
          init_flags: true
        }
      }
      if (pks.length) {
        for (let pk of pks) {
          data[pk] = `${i} ${each} ${t.title} test`
        }
      }
      rawdata = Object.assign({}, data)
      D.push(rawdata)
    }
    for (let i=1; i<=10; i++) {
      result = await api({
        operation: '+',
        data: D[i],
        model: each
      })
      id = result.modelID
      D[i].id = id
    }
    data = D[0]
    rawdata = Object.assign({}, data)

    //console.log(JSON.stringify(rawdatas, null, 2))
    relations = [
      {
        relation_id: R['larger'].id,
        from_id: D[1].id,
        flags: { debug: true },
      },
      {
        relation: { id: R['smaller'].id },
        to_id: D[2].id,
        flags: { debug: true },
      },
      {
        relation_id: R['simular'].id,
        // to_id: D[0], // add this later
        from_id: D[3].id,
        flags: { debug: true },
      },
      {
        relation_id: R['different'].id,
        // from_id: D[0], // add this later
        to_id: D[3].id,
        flags: { debug: true },
      },
      {
        relation_id: R['classmate'].id,
        to_id: D[4].id,
        flags: { debug: true },
      },
      {
        relation_id: R['same_author'].id,
        to_id: D[5].id,
        flags: { debug: true },
      },
      {
        relation_id: R['same'].id,
        to_id: D[6].id,
        flags: { debug: true },
      },
      {
        relation_id: R['same2'].id,
        to_id: D[7].id,
        flags: { debug: true },
      },
      {
        relation: { name: R['CN2EN'].name },
        to_id: D[8].id,
        flags: { debug: true },
      },
      {
        relation: { name: R['CN2JP'].name },
        to_id: D[9].id,
        flags: { debug: true },
      },
    ]
    copy = relations.map(_ => Object.assign({}, _))

    if("create and modify with data.relations") {
      // add other
      // create with data.metadatas
      data.relations = relations
      result = await api({
        operation: '+',
        data,
        model: each
      })
      t.deepEqual(relations, copy) // not change metadatas inside the api
      id = result.modelID
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch)
      for (let index in updated) { // repleace all withs data
        Object.assign(refetch_.relations[index], relations[index])
      }
      Object.assign(refetch_, _.omit(data, ['relations'])) // repleace all simple data
      t.deepEqual(refetch, refetch_)
      await testRelationCount([2,2,2,2,2,2,2,2,2,2])
      await testRelationConsistent(refetch)

      // modify both simple and withs (flags and metadatas)
      updated = result.withs.relations // have id in each metadata
      data.comment = `${each} ${t.title} modified`
      data.flags.in_trush = false
      data.flags.ddebug = true
      newrelations = [ // old [0] and [1] have two value
        {
          id: updated[0].id, // have two value, must use id to search
          comment: 'test comment updated 0',
          flags: {
            add_new_flag: true
          },
        },
        {
          id: updated[1].id, // have two value, must use id to search
          comment: 'test comment updated 1',
          to_id: D[9].id,
          flags: {
            add_new_flag: true
          },
        },
        {
          __query__: {
            relation_id: updated[2].relation_id,
          },
          comment: 'new comment 2',
          flags: {debug: 'change to false', add_new_flag: true}
        },
        {
          relation: {
            name: R['simular'].name
          },
          __query__: {
            relation: {
              name: R['different'].name
            },
          },
          to_id: D[10].id,
          comment: 'update comment 3',
          flags: {debug: 'change to false'}
        },
        {
          relation_id: R['larger'].id,
          __query__: {
            relation: {
              name: R['classmate'].name,
            }
          },
          comment: 'new new comment 4',
          flags: {debug: 'change to false', add_new_flag: true}
        },
        {
          __query__: {
            relation: {
              name: R['same_author'].name,
            },
          },
          from_id: D[9].id,
          comment: 'new comment 5',
          flags: {debug: 'change to false', add_new_flag: true}
        },
        {
          __query__:{
            relation: {
              id: R['same'].id,
            }
          },
          from_id: D[10].id,
          comment: 'comment update 6',
          flags: { debug: 'true to false', add_new_flag: true}
        }
      ]
      data.relations = newrelations // only modify these metadatas
      result = await api({
        operation: '*',
        data,
        model: each,
        query: {id}
      })
      refetch = (await Model.findOne({id}))._doc
      await testRelationConsistent(refetch)
      refetch_ = Object.assign({}, refetch)
      Object.assign(refetch_, _.omit(data, ['relations'])) // replace simple
      updated = newrelations.map(__ => _.omit(__, ['__query__']) )
      for (let i=0; i<=6; i++) {
        Object.assign(refetch_.relations[i], updated[i])
      }
      t.deepEqual(refetch, refetch_)
      await testRelationCount([4,2,4,0,0,2,2,2,2,2])
      // delete it
      result = await api({
        operation: '-',
        model: each,
        query: {id}
      })
      refetch = await Model.findOne({id})
      t.true(refetch === null)
      await testRelationCount([0,0,0,0,0,0,0,0,0,0])
    }
    if("add, modify, delete and reorder relations with field"){
      // create with no metadatas
      delete data.relations
      result = await api({
        operation: '+',
        data,
        model: each
      })
      id = result.modelID
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch, data)
      t.deepEqual(refetch, refetch_)
      await testRelationCount([0,0,0,0,0,0,0,0,0,0])

      // add metadatas with field
      result = await api({
        operation: '+',
        data: { relations: copy },
        model: each,
        query: {id},
        field: 'relations',
      })
      id = result.modelID
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch)
      for (let index in updated) { // repleace all withs data
        Object.assign(refetch_.relations[index], relations[index])
      }
      Object.assign(refetch_, _.omit(data, ['relations'])) // repleace all simple data
      t.deepEqual(refetch, refetch_)
      await testRelationCount([2,2,2,2,2,2,2,2,2,2])
      await testRelationConsistent(refetch)

      // modify with fields
      updated = result.withs.relations
      newrelations = [ // old [0] and [1] have two value
        {
          id: updated[0].id, // have two value, must use id to search
          comment: 'test comment updated 0',
          flags: {
            add_new_flag: true
          },
        },
        {
          id: updated[1].id, // have two value, must use id to search
          comment: 'test comment updated 1',
          to_id: D[9].id,
          flags: {
            add_new_flag: true
          },
        },
        {
          __query__: {
            relation_id: updated[2].relation_id,
          },
          comment: 'new comment 2',
          flags: {debug: 'change to false', add_new_flag: true}
        },
        {
          relation: {
            name: R['simular'].name
          },
          __query__: {
            relation: {
              name: R['different'].name
            },
          },
          to_id: D[10].id,
          comment: 'update comment 3',
          flags: {debug: 'change to false'}
        },
        {
          relation_id: R['larger'].id,
          __query__: {
            relation: {
              name: R['classmate'].name,
            }
          },
          comment: 'new new comment 4',
          flags: {debug: 'change to false', add_new_flag: true}
        },
        {
          __query__: {
            relation: {
              name: R['same_author'].name,
            },
          },
          from_id: D[9].id,
          comment: 'new comment 5',
          flags: {debug: 'change to false', add_new_flag: true}
        },
        {
          __query__:{
            relation: {
              id: R['same'].id,
            }
          },
          from_id: D[10].id,
          comment: 'comment update 6',
          flags: { debug: 'true to false', add_new_flag: true}
        }
      ]
      result = await api({
        operation: '*',
        data: {relations: newrelations},
        model: each,
        query: {id},
        field: 'relations'
      })
      refetch = (await Model.findOne({id}))._doc
      await testRelationConsistent(refetch)
      refetch_ = Object.assign({}, refetch)
      Object.assign(refetch_, _.omit(data, ['relations'])) // replace simple
      updated = newrelations.map(__ => _.omit(__, ['__query__']) )
      for (let i=0; i<=6; i++) {
        Object.assign(refetch_.relations[i], updated[i])
      }
      t.deepEqual(refetch, refetch_)
      await testRelationCount([4,2,4,0,0,2,2,2,2,2])

      // delete relations only
      updated = result.withs.relations
      toDelete = [
        { id: updated[0].id },
        {
          __query__: {
            relation: {
              id: R['CN2EN'].id
            }
          }
        },
        {
          __query__: {
            relation: {
              name: R['CN2JP'].name
            }
          }
        },
      ]
      result = await api({
        operation: '-',
        data: {relations: toDelete},
        model: each,
        query: {id},
        field: 'relations'
      })
      refetch = (await Model.findOne({id}))
      await testRelationConsistent(refetch)
      refetch = refetch._doc.relations
      updated = result.withs.relations
      let ids = updated.map(_=>_.id)
      refetch_ = refetch.filter(_ => ids.includes(_.id))
      t.is(refetch_.length, 0)
      let other_ids = refetch.map(_ => _.other_id)
      for (let eachid of other_ids) {
        refetch = (await Model.findOne({id: eachid}))._doc.relations
        refetch_ = refetch.filter(_ => ids.includes(_.id))
        t.is(refetch_.length, 0)
      }
      await testRelationCount([2,2,4,0,0,2,2,2,0,0])

      // test reorder
      refetch = (await Model.findOne({id}))._doc.relations
      ids = refetch.map(_ => ({id: _.id}))
      let newIDs = _.shuffle(ids)
      result = await api({
        operation: 'o',
        data: {relations: newIDs},
        model: each,
        query: {id},
        field: 'relations'
      })
      refetch = (await Model.findOne({id}))
      await testRelationConsistent(refetch)
      refetch = refetch._doc.relations
      let refetchIDs = Array.from(refetch).map(_ => ({id: _.id}))
      t.deepEqual(newIDs, refetchIDs)
      await testRelationCount([2,2,4,0,0,2,2,2,0,0])
    }
    if("add, modify and delete metadatas.flags with field"){
      let newData = [
        {id: refetch[0].id, flags: {add_by_field_flag: true}},
        {id: refetch[1].id, flags: {add_by_field_flag: true}},
      ]
      result = await api({
        operation: '+',
        data: {[testWiths]: newData},
        model: each,
        query: {id},
        field: `${testWiths}.flags`
      })
      refetch = (await Model.findOne({id}))._doc[testWiths]
      t.is(newData[0].flags.add_by_field_flag, refetch[0].flags.add_by_field_flag)
      t.is(newData[1].flags.add_by_field_flag, refetch[1].flags.add_by_field_flag)

      // modify flags in metadata
      let toModify = refetch.map(__ => _.pick(__, ["id", "flags"])) // old metadatas
      toModify[0].flags.debug = 'hahaha'
      toModify[1].flags.debug = 'lalala'
      toModify[1].flags.ddebug = 'huhuhu'
      result = await api({
        operation: '*',
        data: {[testWiths]: toModify},
        model: each,
        query: {id},
        field: `${testWiths}.flags`
      })
      refetch = await Model.findOne({id})
      refetch = refetch._doc[testWiths]
      t.is( refetch[0].flags.debug, toModify[0].flags.debug )
      t.is( refetch[1].flags.debug, toModify[1].flags.debug )
      t.is( refetch[1].flags.ddebug, toModify[1].flags.ddebug )
      // delete flags in metadata
      refetch = await Model.findOne({id})
      refetch = refetch._doc[testWiths]
      let toDeleteRaw = refetch.map(__ => _.pick(__, ["id", "flags"]))
      toDelete = toDeleteRaw.slice(0,4) // only the later two have flags
      let toDeleteIDs = toDelete.map(_ => _.id)
      result = await api({
        operation: '-',
        data: {[testWiths]: toDelete},
        model: each,
        query: {id},
        field: `${testWiths}.flags`
      })
      refetch = await Model.findOne({id})
      refetch = refetch._doc[testWiths]
      for (let index=0;index<refetch.lenth;index++) {
        let subentry = refetch[index]
        console.log(index, 'subentry:', subentry, 'toDelete:', toDeleteRaw[index])
        if (toDeleteIDs.includes(subentry.id)) {
          t.is(subentry.flags.debug, undefined)
        } else {
          t.is(subentry.flags.debug, toDeleteRaw[index].flags.debug)
        }
      }
      // delete the entry, clean up
      let oldresult = result
      result = await api({
        operation: '-',
        model: each,
        query: {id}
      })
      refetch = await Model.findOne({id})
      t.true(refetch === null)
      await testRelationCount([0,0,0,0,0,0,0,0,0,0])
    }
  }
  t.pass()
})

test.only('family', async t => {
  // init relations
  let testWiths = "fathers"
  // begin test
  let todos = WithsDict.WithFather
  for (let each of todos) {
    async function testFamilyConsistent(result) {
      for (let type of ['fathers', 'children']) {
        for (let item of result[type]) {
          let other_entry = (await Models[each].findOne({id: item.id}))._doc
          let other_type = type === 'fathers' ? 'children' : 'fathers'
          let find = other_entry[other_type].find(_ => _.id === result.id)
          t.true(!!find, `result:${JSON.stringify(result)}\nother_entry:${JSON.stringify(other_entry,null,2)}\nfind:${JSON.stringify(find)}`)
        }
      }
    }
    async function testFamilyDeleteConsistent({id, withs}) {
      for (let type of ['fathers', 'children']) {
        if (!withs[type]) continue
        for (let item of withs[type]) {
          let other_entry = (await Models[each].findOne({id: item.id}))._doc
          let other_type = type === 'fathers' ? 'children' : 'fathers'
          let find = other_entry[other_type].find(_ => _.id === result.id)
          t.true(!find, `withs:${JSON.stringify(withs)}\nother_entry:${JSON.stringify(other_entry,null,2)}\nfind:${JSON.stringify(find)}`)
        }
      }
    }
    let Model = Models[each]
    let pks = getRequire(Model)
    let data, refetch, refetch_, result, id, updated, copy, toDelete, rawdata
    let fathers, children, newfather, newchildren
    let D = []
    for (let i=0; i<=5; i++) {
      data = {
        comment: `${i} ${each} ${t.title} test`,
        flags: {
          init_flags: true
        }
      }
      if (pks.length) {
        for (let pk of pks) {
          data[pk] = `${i} ${each} ${t.title} test`
        }
      }
      rawdata = Object.assign({}, data)
      D.push(rawdata)
    }
    for (let i=1; i<=5; i++) {
      result = await api({
        operation: '+',
        data: D[i],
        model: each
      })
      id = result.modelID
      D[i].id = id
    }
    data = D[0]
    rawdata = Object.assign({}, data)
    async function countFamily(array) {
      let result = []
      for (let data of D) {
        let entry = await Models[each].findOne({id:data.id})
        if (entry) {
          result.push([entry.fathers.length, entry.children.length])
        } else {
          result.push([-1,-1])
        }
      }
      t.deepEqual(array, result)
    }

    //console.log(JSON.stringify(rawdatas, null, 2))
    fathers = [
      {id: D[1].id},
      {id: D[2].id},
      {id: D[5].id},
    ]
    children = [
      {id: D[3].id},
      {id: D[4].id},
    ]

    if("create and modify with data.family") {
      // add other
      // create with data.metadatas
      data.fathers = fathers
      data.children = children
      result = await api({
        operation: '+',
        data,
        model: each
      })
      id = result.modelID
      D[0].id = id
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch)
      for (let index in fathers) { // repleace all withs data
        Object.assign(refetch_.fathers[index], fathers[index])
      }
      for (let index in children) { // repleace all withs data
        Object.assign(refetch_.children[index], children[index])
      }
      Object.assign(refetch_, _.omit(data, ['fathers', 'children'])) // repleace all simple data
      t.deepEqual(refetch, refetch_)
      await testFamilyConsistent(refetch)
      await countFamily([[3,2],[0,1],[0,1],[1,0],[1,0],[0,1]])
      // delete it
      result = await api({
        operation: '-',
        model: each,
        query: {id}
      })
      refetch = await Model.findOne({id})
      t.true(refetch === null)
      await testFamilyDeleteConsistent({id, withs:result.withs})
      await countFamily([[-1,-1],[0,0],[0,0],[0,0],[0,0],[0,0]])
    }
    if("add, modify, delete and reorder family with field"){
      // create with no metadatas
      delete data.fathers
      delete data.children
      result = await api({
        operation: '+',
        data,
        model: each
      })
      id = result.modelID
      D[0].id = id
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch, data)
      t.deepEqual(refetch, refetch_)

      // add family with field
      result = await api({
        operation: '+',
        data: { fathers },
        model: each,
        query: {id},
        field: 'fathers',
      })
      result = await api({
        operation: '+',
        data: { children },
        model: each,
        query: {id},
        field: 'children',
      })
      id = result.modelID
      refetch = (await Model.findOne({id}))._doc
      refetch_ = Object.assign({}, refetch)
      for (let index in fathers) { // repleace all withs data
        Object.assign(refetch_.fathers[index], fathers[index])
      }
      for (let index in children) { // repleace all withs data
        Object.assign(refetch_.children[index], children[index])
      }
      Object.assign(refetch_, _.omit(data, ['fathers', 'children'])) // repleace all simple data
      t.deepEqual(refetch, refetch_)
      await testFamilyConsistent(refetch)
      await countFamily([[3,2],[0,1],[0,1],[1,0],[1,0],[0,1]])

      // delete relations only
      toDelete = [
        {id}
      ]
      result = await api({
        operation: '-',
        data: {fathers: toDelete},
        model: each,
        query: {id: D[4].id},
        field: 'fathers'
      })
      await testFamilyDeleteConsistent({id:D[4].id, withs:result.withs})
      await countFamily([[3,1],[0,1],[0,1],[1,0],[0,0],[0,1]])

      toDelete = [
        {id}
      ]
      result = await api({
        operation: '-',
        data: {children: toDelete},
        model: each,
        query: {id: D[5].id},
        field: 'children'
      })
      await testFamilyDeleteConsistent({id:D[5].id, withs:result.withs})
      await countFamily([[2,1],[0,1],[0,1],[1,0],[0,0],[0,0]])

      toDelete = [
        {id:D[2].id}
      ]
      result = await api({
        operation: '-',
        data: {fathers: toDelete},
        model: each,
        query: {id},
        field: 'fathers'
      })
      await testFamilyDeleteConsistent({id:id, withs:result.withs})
      await countFamily([[1,1],[0,1],[0,0],[1,0],[0,0],[0,0]])

      // test family loop
      let toAdd = [
        {id:D[3].id}
      ]
      let fn = async () => {
        result = await api({
          operation: '+',
          data: {fathers: toAdd},
          model: each,
          query: {id: D[1].id},
          field: 'fathers'
        })
      }
      let error = await t.throwsAsync(fn, Error)
      t.true(error.message.startsWith('detect family loop'))
      await testFamilyDeleteConsistent({id:D[1].id, withs:result.withs})
      await countFamily([[1,1],[0,1],[0,0],[1,0],[0,0],[0,0]])

      // test reorder
      toAdd = [
        {id:D[2].id}
      ]
      result = await api({
        operation: '+',
        data: {fathers: toAdd},
        model: each,
        query: {id},
        field: 'fathers'
      })
      await testFamilyDeleteConsistent({id, withs:result.withs})
      await countFamily([[2,1],[0,1],[0,1],[1,0],[0,0],[0,0]])

      let newfathers = [{id:D[2].id},{id:D[1].id}]
      result = await api({
        operation: 'o',
        data: {fathers: newfathers},
        model: each,
        query: {id},
        field: 'fathers'
      })
      refetch = (await Model.findOne({id}))._doc.fathers
      refetch = Array.from(refetch)
      let fetchids = refetch.map(_ => ({id:_.id}))
      t.deepEqual(fetchids, newfathers)
      await testFamilyDeleteConsistent({id, withs:result.withs})
      await countFamily([[2,1],[0,1],[0,1],[1,0],[0,0],[0,0]])
    }
  }
  t.pass()
})


test.skip('test', async t => {
  let Article = Models.Article
  let n = new Article({
    title: 'test',
    flags: {
      debug: true
    },
    tags: [
      {
        tag_id: 1,
        flags: {
          debug: true
        }
      },
      {
        tag_id: 2,
        flags: {
          debug: true
        }
      }
    ]
  })
  let a = await n.save()
  n.flags.debug = false
  n.tags[0].flags.debug = false
  let b = await n.save()
  console.log(a)
  console.log(b)
  console.log(b.tags[0])
  t.pass()
})
