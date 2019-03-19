// import debugSettings from './server/debug-settings-test'
import globalConfig from "./configs/config.js"
import _ from 'lodash'
import yaml from 'node-yaml'
let config = require('./nuxt.config.js')
let databaseConfig = yaml.readSync('../configs/mongod.yml')
import _models from './server/models'
const {init: database_init} = _models
import __ from './server/models/models'
const {api, getRequire, bulkAdd} = __
import mongoose from 'mongoose'
import test from 'ava'
import globals from './server/globals'
import fs from 'fs'
import path from 'path'
import delay from 'delay'

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}
function assignExists (a, b) {
  let exists = Object.keys(a)
  exists = exists.filter(_ => _ in b)
  let newb = _.pick(b, exists)
  Object.assign(a, newb)
}
function J(obj) {
  return JSON.stringify(obj,null,2)
}

if (globalConfig.database !== 'test') {
  throw Error(`you can only run unittest on test database!`)
}

test.before('init database', async t => {
  globalConfig.demoData = false
  globalConfig.unittest = true
  await delay(1000)
  console.log('delay 5000')
  await database_init({config: globalConfig, databaseConfig})
  for (let plugin of globals.plugins) {
    let entry = await globals.Models.Plugins.findOne({uid: plugin.uid})
    t.truthy(entry)
    entry.active = true
    for (let data of entry.data) {
      data.active = true
    }
    entry.markModified('data')
    await entry.save()
  }
  console.log('all models:', globals.All)
  console.log('Setup complete, init database, enable all plugins')
})
test('after init database', async t => {
  t.true(!!globals.plugins)
  t.pass()
})

test('transaction-base', async t => {
  let Models = globals.Models
  let WithsDict = globals.WithsDict
  let All = globals.All
  // test simple add for Article
  console.log('transaction-base test')
  let session, start, end
  session = await mongoose.startSession()
  session.startTransaction()
  let newA = new Models.Article({title: 'a0'})
  newA.$session(session)
  t.true((await Models.Article.find({title: 'a0'})).length === 0)
  t.true((await Models.Article.find({title: 'a0'}).session(session)).length === 0)
  await newA.save()
  t.true((await Models.Article.find({title: 'a0'})).length === 0)
  t.true((await Models.Article.find({title: 'a0'}).session(session)).length === 1)
  await session.commitTransaction()
  t.true((await Models.Article.find({title: 'a0'})).length === 1)

  session.startTransaction()
  await Models.Article.deleteOne({title: 'a0'}).session(session)
  t.true((await Models.Article.find({title: 'a0'})).length === 1)
  t.true((await Models.Article.find({title: 'a0'}).session(session)).length === 0)
  await session.abortTransaction()
  t.true((await Models.Article.find({title: 'a0'})).length === 1)

  session.startTransaction()
  await Models.Article.deleteOne({title: 'a0'}).session(session)
  t.true((await Models.Article.find({title: 'a0'})).length === 1)
  t.true((await Models.Article.find({title: 'a0'}).session(session)).length === 0)
  await session.commitTransaction()
  t.true((await Models.Article.find({title: 'a0'})).length === 0)

  t.pass()
})

test('basic', async t => { // create, modify and delete for All model
  let Models = globals.Models
  let WithsDict = globals.WithsDict
  let All = globals.All
  for (let each of All) {
    let Model = Models[each]
    let pks = getRequire(Model)
    let data, refetch, refetch_, result, id, rawdata, newdata
    data = {
      comment: `${each} basic test`,
    }
    if (pks.length) {
      for (let pk of pks) {
        data[pk] = `${each} basic test`
      }
    }
    rawdata = Object.assign({}, data)
    newdata = {
      comment: `new ${each} basic test`,
    }
    if (pks.length) {
      for (let pk of pks) {
        newdata[pk] = `new ${each} basic test`
      }
    }
    // create
    result = await api({
      operation: '+',
      data,
      model: each
    })
    id = result.modelID
    refetch = clone((await Model.findOne({id}))._doc)
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    t.is(result.flags.entry, true)
    t.is(result.flags.origin.length,1)
    // create with origin manual
    result = await api({
      operation: '+',
      query:{id},
      data,
      model: each
    })
    t.is(result.flags.entry, false)
    t.is(result.flags.origin.length, 0)
    // create with origin auto1
    result = await api({
      operation: '+',
      query:{id},
      data,
      model: each,
      origin: {id: 'auto1'}
    })
    t.is(result.flags.entry, false)
    t.is(result.flags.origin.length, 1)
    // create with origin auto1, addNothing
    result = await api({
      operation: '+',
      query:{id},
      data,
      model: each,
      origin: {id: 'auto1'}
    })
    t.is(result.flags.entry, false)
    t.is(result.flags.origin.length, 0)
    // create with origin auto2
    result = await api({
      operation: '+',
      query:{id},
      data,
      model: each,
      origin: {id: 'auto2'}
    })
    t.is(result.flags.entry, false)
    t.is(result.flags.origin.length, 1)
    // create newdata with origin auto3
    result = await api({
      operation: '+',
      query:{comment: newdata.comment},
      data: newdata,
      model: each,
      origin: {id: 'auto3'}
    })
    t.is(result.flags.entry, true)
    t.is(result.flags.origin.length, 1)
    newdata.id = result.modelID
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
    refetch = clone((await Model.findOne({id}))._doc)
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    // delete manual and auto1
    result = await api({
      operation: '-',
      model: each,
      query: {id},
      origin: [{id: 'manual'}, {id: 'auto1'}]
    })
    t.is(result.flags.entry, false)
    t.is(result.flags.origin.length, 2)
    // delete manual again
    result = await api({
      operation: '-',
      model: each,
      query: {id}
    })
    t.is(result.flags.entry, false)
    t.is(result.flags.origin.length, 0)
    // delete manual auto2, delete entry
    result = await api({
      operation: '-',
      model: each,
      query: {id},
      origin: [{id: 'auto2'}]
    })
    t.is(result.flags.entry, true)
    t.is(result.flags.origin.length, 1)
    refetch = await Model.findOne({id})
    t.true(refetch === null)
    // add with multiply origin
    result = await api({
      operation: '+',
      data: rawdata,
      model: each,
      origin: [
        {id: 'manual'},
        {id: 'auto1'},
        {id: 'auto2'},
        {id: 'auto3'},
      ]
    })
    t.is(result.flags.entry, true)
    t.is(result.flags.origin.length, 4)
    id = result.modelID
    // delete all
    result = await api({
      operation: '-',
      model: each,
      query: {id},
      origin: [], // force delete it, no matter how many origins it has
    })
    t.is(result.flags.entry, true)
    t.is(result.flags.origin.length, 4)
    refetch = await Model.findOne({id})
    t.true(refetch === null)
    // delete new data
    result = await api({
      operation: '-',
      model: each,
      query: {id: newdata.id},
      origin: {id: 'auto4'}, // force delete it, no matter how many origins it has
    })
    t.is(result.flags.entry, false)
    t.is(result.flags.origin.length, 0)
    result = await api({
      operation: '-',
      model: each,
      query: {id: newdata.id},
      origin: {id: 'auto3'}, // force delete it, no matter how many origins it has
    })
    t.is(result.flags.entry, true)
    t.is(result.flags.origin.length, 1)
    refetch = await Model.findOne({id: newdata.id})
    t.true(refetch === null)
  }
  t.pass()
})
test('flags', async t => {
  let Models = globals.Models
  let WithsDict = globals.WithsDict
  let All = globals.All
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
      refetch = clone((await Model.findOne({id}))._doc)
      refetch_ = Object.assign({}, refetch, data)
      t.deepEqual(refetch, refetch_) // test add with flags
      // modify both simple and withs
      data.comment = `${each} ${t.title} modified`
      data.flags.in_trush = false
      data.flags.ddebug = true
      delete data.flags.debug
      result = await api({
        operation: '*',
        data,
        model: each,
        query: {id}
      })
      refetch = clone((await Model.findOne({id}))._doc)
      refetch_ = Object.assign({}, refetch, _.omit(data, ['flags']))
      refetch_.flags = Object.assign(refetch_.flags, data.flags)
      t.deepEqual(refetch, refetch_) // test add with flgas and simple
      // clean up, delete this entry
      result = await api({
        operation: '-',
        model: each,
        query: {id}
      })
      refetch = await Model.findOne({id})
      t.true(refetch === null)
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
      refetch = clone((await Model.findOne({id}))._doc)
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
      refetch = clone((await Model.findOne({id}))._doc)
      t.deepEqual(refetch.flags, flags) // test add flag with 'flags' field
      // modify flags with 'flags' field
      flags.in_trush = 3
      flags.debug = 4
      flags.debugg = 5
      delete flags.ddebug
      result = await api({
        operation: '*',
        data:{flags},
        model: each,
        query: {id},
        field: 'flags'
      })
      refetch = (await Model.findOne({id}))._doc.flags
      refetch_ = Object.assign({}, refetch, flags)
      t.deepEqual(refetch, refetch_) // test flags modifyA
      flags = refetch
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
      refetch = clone((await Model.findOne({id}))._doc)
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
test('test all taglike api', async t => {
  let Models = globals.Models
  let WithsDict = globals.WithsDict
  let All = globals.All
  let apis = [
    {name: 'relations', withname: 'WithRelation', model:'Relation'},
    {name: 'metadatas', withname: 'WithMetadata', model:'Metadata'},
    {name: 'catalogues', withname: 'WithCatalogue', model:'Catalogue'},
    {name: 'tags', withname: 'WithTag', model:'Tag'},
    {name: 'family', withname: 'WithFather'},
  ]
  const pstep = false
  for (let apiname of apis) {
    let {name, withname, model: tagModel} = apiname
    console.log(`test ${name}`)
    let todos = WithsDict[withname]
    for (let each of todos) {
      if (pstep) console.log(`... ${each}`)
      let Model = Models[each]
      let pks = getRequire(Model)
      let data, refetch, refetch_, result, id, ids, updated
      let taglike, newtaglike, deltaglike, rawdata, toDelete, tname
      let getNewTaglike, getDelTaglike, modifyMap, getOtherData, input
      let __, getBadNewTaglike
      let testFunctions = {}
      let testDatas = {}
      let omitnames = [name]
      async function doTest({refetch, result}) {
        if (testDatas[tname]) {
          for (let key of Object.keys(testFunctions)) {
            if (testDatas && testDatas[tname][key]) {
              await testFunctions[key]({refetch, result, data: testDatas[tname][key]})
            }
          }
        }
      }
      let D = []
      let T = []
      let N = 15
      if('setup') {
        // create N+1 articles, only create N-1 of them, D[0] is created later
        for (let i=0; i<=N; i++) {
          data = {
            comment: `${i} ${each} ${name} test`,
            flags: { debug: true }
          }
          if (pks.length) {
            for (let pk of pks) {
              data[pk] = `${i} ${each} ${name} test`
            }
          }
          rawdata = Object.assign({}, data)
          D.push(rawdata)
        }
        for (let i=1; i<=N; i++) {
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
        if (['catalogues', 'metadatas', 'relations', 'tags'].includes(name)) {
          // should create taglikes for this apis
          for (let index=0; index<=N; index++) {
            T.push({
              name: `${each}-${name}-${index}`,
              comment: `comment for index ${index}`
            })
          }
          for (let each of T) {
            let result = await api({
              operation: '+',
              data: each,
              model: tagModel
            })
            let id = result.modelID
            each.id = id
          }
        }
        if (name === 'relations') {
          taglike = {relations: [
            { relation_id: T[0].id, // all _id
              from_id: D[1].id, flags: { debug: true }, },
            { relation: { id: T[1].id }, // Q: relation, to
              to: {id: D[2].id}, flags: { debug: true }, },
            { relation_id: T[2].id, // Q: from (non pk)
              from: { comment: D[3].comment }, flags: { debug: true }, },
            { relation_id: T[3].id, // just add
              to_id: D[3].id, flags: { debug: true }, },
            { relation_id: T[4].id, // just add
              to_id: D[4].id, flags: { debug: true }, },
            { relation_id: T[5].id, // Q: to
              to: {id: D[5].id}, flags: { debug: true }, },
            { relation_id: T[6].id, // just add
              to_id: D[6].id, flags: { debug: true }, },
            { relation_id: T[7].id, // Q: to
              to: {id: D[7].id}, flags: { debug: true }, },
            { relation: { name: T[8].name }, // Q: relation
              to_id: D[8].id, flags: { debug: true }, },
            { relation: { name: T[9].name }, // Q: relation
              to_id: D[9].id, flags: { debug: true }, },
          ]}
          getNewTaglike = (U) => { return {relations: [
            { id: U[0].id, // M: comment and flags
              modify_flags: {changeTaglike: false}, comment: 'test comment updated 0', flags: { debug: 'change to false', add_new_flag: true }, },
            { id: U[1].id, // M: to(0->2 => 0->9)
              to_id: D[9].id, modify_flags: {changeTaglike: true}, comment: 'test comment updated 1', flags: { debug: 'change to false', add_new_flag: true }, },
            { // _Q_: relation_id
              __query__: { relation_id: U[2].relation_id, },
              modify_flags: {changeTaglike: false}, comment: 'new comment 2', flags: {debug: 'change to false', add_new_flag: true} },
            { // _Q_: relation; Q: relation, to; M relation(3 => 2), to(0->3 => 0->10)
              __query__: { relation: { name: T[3].name }, },
              relation: { name: T[2].name }, modify_flags: {changeTaglike: true},
              to: {id:D[10].id}, comment: 'update comment 3', flags: {debug: 'change to false', debug: 'change to false'}, },
            { // _Q_: relation; M: relation(4 => 1)
              __query__: { relation: { name: T[4].name, } }, modify_flags: {changeTaglike: true},
              relation_id: T[0].id, comment: 'new new comment 4', flags: {debug: 'change to false', add_new_flag: true} },
            { // _Q_: relation; Q: from; M: to (0->5 => 9->0)
              __query__: { relation: { name: T[5].name, }, }, modify_flags: {changeTaglike: true},
              from: {id:D[9].id}, comment: 'new comment 5', flags: {debug: 'change to false', add_new_flag: true} },
            { // _Q_: relation; M: to (0->6 => 10->0)
              __query__:{ relation: { id: T[6].id, } }, modify_flags: {changeTaglike: true},
              from_id: D[10].id, comment: 'comment update 6', flags: { debug: 'true to false', add_new_flag: true} } ]} }
          getBadNewTaglike = (U) => { return {relations: [
            {
              __query__: { relation: { name: T[0].name }, from: {id: D[1].id}},
              relation: { name: T[1].name },
              to: { id: D[9].id },
            }
          ]} }
          getDelTaglike = (U) => { return {relations: [
            { id: U[0].id },
            { __query__: { relation: { id: T[8].id } } },
            { __query__: { relation: { name: T[9].name } } }, ]} }
          if ('test fuctions and results') {
            testFunctions.testRelationCount = async ({data}) => {
              let array = data
              let counts = []
              let length = array.length
              let count = 0
              for (let relation of T) {
                let eachRelation = (await Models.Relation.findOne({id: relation.id}))._doc
                counts.push(eachRelation.r[each].length)
                count += 1
                if (count === length) break
              }
              // console.log({array, counts})
              t.deepEqual(array, counts, JSON.stringify({array, counts}))
            }
            testFunctions.testRelationConsistent = async ({refetch}) => {
              let result = refetch
              for (let relation of result.relations) {
                let this_sub_entry = relation
                let that_sub_entry = clone(relation)
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
                other_that_sub_entry = clone(other_that_sub_entry._doc) // if not clone, will get stuck here...
                t.deepEqual(other_that_sub_entry, that_sub_entry, JSON.stringify({this_sub_entry, that_sub_entry, other_that_sub_entry},null,2))
              }
            }
            testFunctions.testRelationDelOther = async ({refetch}) => {
              refetch = refetch[name]
              updated = result.withs[name]
              let ids = updated.map(_=>_.id)
              let other_ids = refetch.map(_ => _.other_id)
              for (let eachid of other_ids) {
                refetch = clone((await Model.findOne({id: eachid}))._doc).relations
                refetch_ = refetch.filter(_ => ids.includes(_.id))
                t.is(refetch_.length, 0)
              }
            }

            let NN = taglike.relations.length
            testDatas = {
              '0-0': {
                testRelationCount: [...Array(NN).keys()].map(_ => 2),
                testRelationConsistent: true },
              '0-1': {
                testRelationCount: [4,2,4,0,0,2,2,2,2,2],
                testRelationConsistent: true },
              '0-2': {
                testRelationCount: [...Array(NN).keys()].map(_ => 0), },
              '1-0': {
                testRelationCount: [...Array(NN).keys()].map(_ => 0), },
              '1-1': {
                testRelationCount: [...Array(NN).keys()].map(_ => 2),
                testRelationConsistent: true, },
              '1-2': {
                testRelationCount: [4,2,4,0,0,2,2,2,2,2],
                testRelationConsistent: true },
              '1-3': {
                testRelationCount: [2,2,4,0,0,2,2,2,0,0],
                testRelationConsistent: true,
                testRelationDelOther: true, },
              '1-4': {
                testRelationCount: [2,2,4,0,0,2,2,2,0,0],
                testRelationConsistent: true, },
              '2-0': {
                testRelationCount: [...Array(NN).keys()].map(_ => 0), },
            }
          }
        } else if (name === 'metadatas') {
          taglike = {metadatas:[
            { metadata_id: T[0].id,
              value: 'test rate string', comment: 'test comment', flags: { debug: true }, },
            { metadata: { id: T[1].id }, // Q: metadata
              value: 'test color string', comment: 'test comment', flags: { debug: true }, },
            { metadata: { name: T[2].name }, // Q: metadata
              value: 233, comment: 'test comment', flags: { debug: true }, },
            { metadata: { comment: T[3].comment},
              value: {msg: 'object value'}, comment: 'test comment', flags: { debug: true }, },
            { metadata: { name: T[4].name },
              value: 'test rate string 2', comment: 'test comment', flags: { debug: true }, },
            { metadata: { id: T[5].id },
              value: 'test color string 2', comment: 'test comment', flags: { debug: true }, },
          ]}
          getNewTaglike = (U) => { return {metadatas:[
            { id: U[1].id, // M: value, comment and flags
              value: 'test color string updated', modify_flags: {changeTaglike: false}, comment: 'test comment updated', flags: { debug: 'change to false', add_new_flag: true }, },
            { // _Q_: metadata; Q: metadata; M: metadata(3 => 4)
              __query__: { metadata: { name: T[3].name }, }, modify_flags: {changeTaglike: true},
              metadata: { name: T[6].name }, value: {msg: 'mixed_value modify', mixed_value_add: true}, comment: 'update comment', flags: { debug: 'change to false', add_new_flag: true }, },
            { // _Q_: metadata_id; M: value...
              __query__: { metadata_id: U[2].metadata_id, }, modify_flags: {changeTaglike: false},
              value: 'test rate string 2 modified', comment: 'new comment', flags: { debug: 'change to false', add_new_flag: true }, },
          ]}}
          getBadNewTaglike = (U) => { return {metadatas:[
            { // _Q_: metadata_id; M: value...
              __query__: { metadata: {name: T[1].name}, },
              metadata: { name: T[0].name }
            }
          ]}}
          modifyMap = {
            0:1, 1:3, 2:2
          }
          getDelTaglike = (U) => { return {metadatas:[
            { id: updated[0].id, },
            { __query__: { metadata: { name: T[4].name }, }, },
            { __query__: { metadata_id: U[2].metadata_id, }, }, ]} }
          if ('test fuctions and results') {
            testFunctions.testMetadataCount = async ({data}) => {
              let array = data
              let counts = []
              let length = array.length
              let count = 0
              for (let metadata of T) {
                let eachMetadata = (await Models.Metadata.findOne({id: metadata.id}))._doc
                counts.push(eachMetadata.r[each].length)
                count += 1
                if (count === length) break
              }
              t.deepEqual(array, counts, J({array, counts}))
            }
            let NN = taglike.length
            testDatas = {
              '0-0': { testMetadataCount: [1,1,1,1,1,1,0], },
              '0-1': { testMetadataCount: [1,1,1,0,1,1,1], },
              '0-2': { testMetadataCount: [0,0,0,0,0,0,0], },
              '1-0': { testMetadataCount: [0,0,0,0,0,0,0], },
              '1-1': { testMetadataCount: [1,1,1,1,1,1,0], },
              '1-2': { testMetadataCount: [1,1,1,0,1,1,1], },
              '1-3': { testMetadataCount: [0,1,0,0,0,1,1], },
              '1-4': { testMetadataCount: [0,1,0,0,0,1,1], },
              '2-0': { testMetadataCount: [0,0,0,0,0,0,0], },
            }
          }
        } else if (name === 'catalogues' || name === 'tags') {
          let n = name.slice(0, -1)
          let n_id = n + "_id"
          taglike = {[name]:[
            { [n_id]: T[0].id,
              comment: 'test comment', flags: { debug: true }, },
            { [n]: { id: T[1].id },
              comment: 'test comment', flags: { debug: true }, },
            { [n]: { name: T[2].name },
              comment: 'test comment', flags: { debug: true }, },
            { [n_id]: T[3].id,
              comment: 'test comment', flags: { debug: true }, },
            { [n_id]: T[5].id,
              comment: 'test comment', flags: { debug: true }, },
            { [n_id]: T[6].id,
              comment: 'test comment', flags: { debug: true }, },
            { [n_id]: T[7].id,
              comment: 'test comment', flags: { debug: true }, },
            { [n_id]: T[8].id,
              comment: 'test comment', flags: { debug: true }, },
          ]}
          getNewTaglike = (U) => { return {[name]:[
            { id: U[0].id, modify_flags: {changeTaglike: false},
              comment: 'test comment updated 0', flags: { debug: false, add_new_flag: true }, },
            { __query__: { [n_id]: T[1].id, }, modify_flags: {changeTaglike: false},
              comment: 'test comment updated 1', flags: { debug: false, add_new_flag: true }, },
            { __query__: { [n]: { id: T[2].id, } }, modify_flags: {changeTaglike: false},
              comment: 'new comment 2', flags: {debug: false, add_new_flag: true}
            },
            { __query__: { [n]: { name: T[3].name }, },
              [n]: { id: T[4].id }, modify_flags: {changeTaglike: true},
              comment: 'update comment 3', flags: {debug: false, add_new_flag: true}
            },
          ]}}
          getBadNewTaglike = (U) => { return {[name]:[
            { __query__: { [n]: { name: T[1].name }, },
              [n]: { name: T[0].name },
            },
          ]}}
          getDelTaglike = (U) => { return {[name]:[
            { id: updated[0].id, },
            { __query__: { [n]: { name: T[4].name }, }, },
            { __query__: { [n_id]: U[2][n_id], }, }, ] } }
          if('test fuctions and results') {
            testFunctions.testCount = async ({data}) => {
              let array = data
              let counts = []
              let length = array.length
              let count = 0
              for (let taglike of T) {
                let eachentry = (await Models[tagModel].findOne({id: taglike.id}))._doc
                counts.push(eachentry.r[each].length)
                count += 1
                if (count === length) break
              }
              t.deepEqual(array, counts, J({array, counts}))
            }
            let NN = taglike.length
            testDatas = {
              '0-0': { testCount: [1,1,1,1,0,1,1,1,1], },
              '0-1': { testCount: [1,1,1,0,1,1,1,1,1], },
              '0-2': { testCount: [0,0,0,0,0,0,0,0,0], },
              '1-0': { testCount: [0,0,0,0,0,0,0,0,0], },
              '1-1': { testCount: [1,1,1,1,0,1,1,1,1], },
              '1-2': { testCount: [1,1,1,0,1,1,1,1,1], },
              '1-3': { testCount: [0,1,0,0,0,1,1,1,1], },
              '1-4': { testCount: [0,1,0,0,0,1,1,1,1], },
              '2-0': { testCount: [0,0,0,0,0,0,0,0,0], },
            }
          }
        } else if (name === 'family') {
          omitnames = ['fathers', 'children']
          taglike = {
            fathers: [
              {id: D[1].id},
              {id: D[2].id},
              {comment: D[5].comment},
              {id: D[6].id},
              {id: D[7].id},
              {id: D[8].id},
            ],
            children: [
              {id: D[3].id},
              {id: D[4].id},
              {id: D[9].id},
              {id: D[10].id},
              {id: D[11].id},
            ]
          }
          getDelTaglike = (U) => { return [
            {
              tname: '1-3-0',
              query: {id: D[4].id},
              deltaglike: {fathers: [{id: data.id}]},
              model: each,
            },
            {
              tname: '1-3-1',
              query: {id: D[5].id},
              deltaglike: {children: [{id: data.id}]},
              model: each,
            },
            {
              tname: '1-3-2',
              query: {id: data.id},
              deltaglike: {fathers: [{id: D[2].id}]},
              model: each,
            }
          ]}
          if('test functions and results') {
            testFunctions.countFamily = async ({data}) => {
              let array = data
              let result = []
              let length = array.length
              let count = 0
              for (let data of D) {
                let entry = await Models[each].findOne({id:data.id})
                if (entry) {
                  result.push([entry.fathers.length, entry.children.length])
                } else {
                  result.push([-1,-1])
                }
                count += 1
                if (count === length) break
              }
              t.deepEqual(array, result)
            }
            testFunctions.testFamilyConsistent = async ({refetch}) => {
              result = refetch
              for (let type of ['fathers', 'children']) {
                for (let item of result[type]) {
                  let other_entry = (await Models[each].findOne({id: item.id}))._doc
                  let other_type = type === 'fathers' ? 'children' : 'fathers'
                  let find = other_entry[other_type].find(_ => _.id === result.id)
                  t.true(!!find, `result:${JSON.stringify(result)}\nother_entry:${JSON.stringify(other_entry,null,2)}\nfind:${JSON.stringify(find)}`)
                }
              }
            }
            testFunctions.testFamilyDeleteConsistent = async ({result}) => {
              let {id: modelID, withs} = result
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
            testDatas = {
              '0-0': {
                countFamily: [[6,5],[0,1],[0,1],[1,0],[1,0],[0,1],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0]],
                testFamilyConsistent: true },
              '0-2': {
                countFamily: [[-1,-1],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[0,0]],
                testFamilyDeleteConsistent: true },
              '1-1': {
                countFamily: [[6,5],[0,1],[0,1],[1,0],[1,0],[0,1],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0]],
                testFamilyConsistent: true },
              '1-3-0': {
                countFamily: [[6,4],[0,1],[0,1],[1,0],[0,0],[0,1],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0]],
                testFamilyDeleteConsistent: true },
              '1-3-1': {
                countFamily: [[5,4],[0,1],[0,1],[1,0],[0,0],[0,0],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0]],
                testFamilyDeleteConsistent: true },
              '1-3-2': {
                countFamily: [[4,4],[0,1],[0,0],[1,0],[0,0],[0,0],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0]],
                testFamilyDeleteConsistent: true },
              '1-5': {
                countFamily: [[4,4],[0,1],[0,0],[1,0],[0,0],[0,0],[0,1],[0,1],[0,1],[1,0],[1,0],[1,0]],
                testFamilyConsistent: true },
              }
            }
        }
      }
      // test functions
      async function createWithTaglike (input) {
        let {data, taglike, model} = input
        let omitnames = Object.keys(taglike)
        let datause = Object.assign({}, data, taglike)
        let result = await api({
          operation: '+',
          data: datause,
          model,
        })
        let id = result.modelID
        data.id = id
        let refetch = clone((await Model.findOne({id}))._doc)
        let refetch_ = clone(refetch)
        for (let name of Object.keys(taglike)) {
          for (let index in taglike[name]) { // repleace all withs data
            assignExists(refetch_[name][index], taglike[name][index])
          }
        }
        Object.assign(refetch_, _.omit(data, omitnames)) // repleace all simple data
        t.deepEqual(refetch, refetch_)
        return {result, refetch}
      }
      async function modifyWithTaglike (input) {
        let {data, newtaglike, query, modifyMap, model} = input
        let omitnames = Object.keys(newtaglike)
        data.comment = `${each} ${name} modified`; data.flags.debug = false; data.flags.add_new_flag = true;
        let datause = Object.assign({}, data, newtaglike)
        let result = await api({
          operation: '*',
          data: datause,
          model,
          query,
        })
        let refetch = clone((await Model.findOne(query))._doc)
        let refetch_ = clone(refetch)
        Object.assign(refetch_, _.omit(data, omitnames)) // replace simple
        for (let name of Object.keys(newtaglike)) {
          for (let index in newtaglike[name]) { // repleace all withs data
            if (modifyMap) {
              assignExists(refetch_[name][modifyMap[index]], newtaglike[name][index])
            } else {
              assignExists(refetch_[name][index], newtaglike[name][index])
            }
          }
        }
        for (let name of Object.keys(newtaglike)) {
          let withs = result.withs[name]
          for (let index in newtaglike[name]) { // repleace all withs data
            if (newtaglike[name][index].modify_flags) {
              t.deepEqual(newtaglike[name][index].modify_flags, withs[index].modify_flags, J(withs[index]))
            }
          }
        }

        t.deepEqual(refetch, refetch_)
        return {result, refetch}
      }
      async function deleteWithID (input) {
        let {query, model} = input
        let result = await api({
          operation: '-',
          model,
          query,
        })
        let refetch = await Model.findOne(query)
        t.true(refetch === null)
        return {result, refetch}
      }
      async function createWithCleanData (input) {
        let {data, model} = input
        let result = await api({
          operation: '+',
          data,
          model,
        })
        let id = result.modelID
        data.id = id
        let refetch = clone((await Model.findOne({id}))._doc)
        let refetch_ = clone(refetch)
        Object.assign(refetch_, data) // replace simple
        t.deepEqual(refetch, refetch_)
        return {result, refetch}
      }
      async function addWithField (input) {
        let {query, taglike, model} = input
        let fields = Object.keys(taglike)
        let refetch, result
        for (let field of fields) {
          result = await api({
            operation: '+',
            data: taglike,
            model,
            query,
            field,
          })
          let id = result.modelID
          refetch = clone((await Model.findOne({id}))._doc)
          let refetch_ = clone(refetch)
          for (let index in taglike[field]) { // repleace all withs data
            assignExists(refetch_[field][index], taglike[field][index])
          }
          t.deepEqual(refetch, refetch_)
        }
        return {result, refetch}
      }
      async function modifyWithField (input) {
        let {query, newtaglike, modifyMap, model} = input
        let fields = Object.keys(newtaglike)
        if (fields.length>1) throw Error(`more than one field! ${taglike}`)
        let field = fields[0]
        let result = await api({
          operation: '*',
          data: newtaglike,
          model,
          query,
          field,
        })
        let refetch = clone((await Model.findOne(query))._doc)
        let refetch_ = clone(refetch)
        for (let index in newtaglike[field]) { // repleace all withs data
          if (modifyMap) {
            assignExists(refetch_[field][modifyMap[index]], newtaglike[field][index])
          } else {
            assignExists(refetch_[field][index], newtaglike[field][index])
          }
        }
        t.deepEqual(refetch, refetch_)
        return {result, refetch}
      }
      async function deleteWithField (input) {
        let {query, deltaglike, model} = input
        let fields = Object.keys(deltaglike)
        if (fields.length>1) throw Error(`more than one field! ${taglike}`)
        let field = fields[0]
        let result = await api({
          operation: '-',
          data: deltaglike,
          model,
          query,
          field
        })
        let refetch = clone((await Model.findOne(query))._doc)
        let nrefetch = refetch[field]
        let updated = result.withs[field]
        let ids = updated.map(_=>_.id)
        let refetch_ = nrefetch.filter(_ => ids.includes(_.id))
        t.is(refetch_.length, 0)
        return {result, refetch}
      }

      // do tests
      if("create, modify with data.taglike") {
        if(tname='0-0') { // create with data.taglike
          input = {data, taglike, model:each}
          __ = await createWithTaglike(input)
          result = __.result
          refetch = __.refetch
          await doTest({refetch, result})
          if (pstep) console.log(`  ${tname} done`) }
        if((tname='0-1') && name !== 'family') { // modify with data.taglike
          updated = refetch[name]
          newtaglike = getNewTaglike(updated)
          input = {data, newtaglike, query: {id: result.result.id}, modifyMap, model:each}
          __ = await modifyWithTaglike (input)
          result = __.result
          refetch = __.refetch
          await doTest({refetch, result})
          if (pstep) console.log(`  ${tname} done`) }
        if(tname='0-2') { // modify with data.taglike
          __ = await deleteWithID({query: {id: data.id}, model:each})
          result = __.result
          await doTest({result})
          if (pstep) console.log(`  ${tname} done`) } }
      if("add, modify, delete (and reorder) taglike with field") {
        if(tname='1-0') { // create clean articlelike
          input = {data, model:each}
          __ = await createWithCleanData(input)
          result = __.result
          refetch = __.refetch
          await doTest({refetch, result})
          if (pstep) console.log(`  ${tname} done`)
        }
        if(tname='1-1') { // add taglike with field
          input = {query:{id: result.result.id}, taglike, model:each}
          __ = await addWithField(input)
          result = __.result
          refetch = __.refetch
          await doTest({refetch, result})
          if (pstep) console.log(`  ${tname} done`) }
        if((tname='1-2') && name !== 'family') { // modify taglike with field
          updated = refetch[name]
          newtaglike = getNewTaglike(updated)
          input = {query:{id: result.result.id}, newtaglike, modifyMap, model:each}
          __ = await modifyWithField(input)
          result = __.result
          refetch = __.refetch
          await doTest({refetch, result})
          if (pstep) console.log(`  ${tname} done`) }
        if((tname='1-2-1') && name !== 'family') { // modify cause duplicated
          updated = refetch[name]
          newtaglike = getBadNewTaglike(updated)
          let fn = async () => {
            input = {query:{id: result.result.id}, newtaglike, model:each}
            await modifyWithField(input)
          }
          let error = await t.throwsAsync(fn, Error)
          t.true(error.message.startsWith('modification cause duplicated'))
          if (pstep) console.log(`  ${tname} done`) }
        if((tname='1-3') && name !== 'family') { // delete some taglike with field
          updated = refetch[name]
          deltaglike = getDelTaglike(updated)
          input = {query:{id: result.result.id}, deltaglike, model:each}
          __ = await deleteWithField(input)
          result = __.result
          refetch = __.refetch
          await doTest({refetch, result})
          if (pstep) console.log(`  ${tname} done`)
        } else { // test family delete
          let inputs = getDelTaglike()
          for (let input of inputs) {
            tname = input.tname
            __ = await deleteWithField(input)
            result = __.result
            refetch = __.refetch
            await doTest({refetch, result})
          }
        }
        if(tname='1-4') { // reorder al taglikes
          id = data.id
          let names = name==='family' ? ['fathers', 'children'] : [name]
          for (let name of names) {
            refetch = clone((await Model.findOne({id}))._doc)[name]
            ids = refetch.map(_ => ({id: _.id}))
            let newIDs = _.shuffle(ids)
            result = await api({
              operation: 'o',
              data: {[name]: newIDs},
              model: each,
              query: {id},
              field: name
            })
            refetch = clone((await Model.findOne({id}))._doc)
            await doTest({refetch, result})
            refetch_ = refetch[name]
            let refetchIDs = Array.from(refetch_).map(_ => ({id: _.id}))
            t.deepEqual(newIDs, refetchIDs)
          }
          if (pstep) console.log(`  ${tname} done`) } }
        if((tname='1-5')&&name==='family') { // test familyLoop
          let toAdd = [ {id:D[3].id} ]
          let fn = async () => {
            await api({
              operation: '+',
              data: {fathers: toAdd},
              model: each,
              query: {id: D[1].id},
              field: 'fathers'
            })
          }
          let error = await t.throwsAsync(fn, Error)
          t.true(error.message.startsWith('detect family loop'))
          await doTest({refetch, result}) }
      if("add, modify and delete taglike.flags with field" && name!=='family') {
        // add flag with field
        id = data.id
        tname = 'modify flag'
        refetch = refetch_
        let oldData = [
          {id: refetch[0].id, flags: refetch[0].flags},
          {id: refetch[1].id, flags: refetch[1].flags},
        ]
        let newData = [
          {id: refetch[0].id, flags: {add_by_field_flag: true}},
          {id: refetch[1].id, flags: {add_by_field_flag: true}},
        ]
        Object.assign(oldData[0].flags, newData[0].flags)
        Object.assign(oldData[1].flags, newData[1].flags)
        result = await api({
          operation: '+',
          data: {[name]: newData},
          model: each,
          query: {id},
          field: `${name}.flags`
        })
        refetch = clone((await Model.findOne({id}))._doc)[name]
        refetch = refetch.map(__ => _.pick(__, ["id", "flags"])).slice(0,2) // old metadatas
        // console.log(J({refetch, oldData}))
        t.deepEqual(refetch, oldData)
        if (pstep) console.log(`  ${tname} done`)

        // modify flags with field
        tname = 'modify flag'
        let toModify = refetch.map(__ => _.pick(__, ["id", "flags"])) // old metadatas
        toModify[0].flags.debug = 'hahaha'
        toModify[1].flags.debug = 'lalala'
        toModify[1].flags.new_added = 'huhuhu'
        delete toModify[0].flags.add_by_field_flag
        delete toModify[1].flags.add_by_field_flag
        result = await api({
          operation: '*',
          data: {[name]: toModify},
          model: each,
          query: {id},
          field: `${name}.flags`
        })
        refetch = await Model.findOne({id})
        refetch = refetch._doc[name]
        t.is( refetch[0].flags.debug, toModify[0].flags.debug )
        t.is( refetch[1].flags.debug, toModify[1].flags.debug )
        t.is( refetch[1].flags.new_added, toModify[1].flags.new_added )
        if (pstep) console.log(`  ${tname} done`)

        // delete flags in metadata
        tname = 'delete flag'
        refetch = clone((await Model.findOne({id}))._doc)[name]
        let toDeleteRaw = refetch.map(__ => _.pick(__, ["id", "flags"]))
        toDelete = toDeleteRaw.slice(0,2)
        let toDeleteIDs = toDelete.map(_ => _.id)
        result = await api({
          operation: '-',
          data: {[name]: toDelete},
          model: each,
          query: {id},
          field: `${name}.flags`
        })
        refetch = clone((await Model.findOne({id}))._doc)[name]
        for (let index=0;index<refetch.lenth;index++) {
          let subentry = refetch[index]
          if (toDeleteIDs.includes(subentry.id)) {
            t.is(Object.keys(subentry.flags), 0)
          } else {
            t.deepEqual(subentry.flags, toDeleteRaw[index].flags)
          }
        }
        if (pstep) console.log(`  ${tname} done`)

        // delete the entry, clean up
        tname = '2-0'
        __ = await deleteWithID({query: {id: data.id}, model:each})
        result = __.result
        await doTest({result})
        if (pstep) console.log(`  ${tname} done`)
      }

      if('clean up') {
        // delete N articles
        for (let d of D) {
          let entry = await api({
            operation: 'findOne',
            query: {id: d.id},
            model: each
          })
          if (!entry) continue
          let result = await api({
            operation: '-',
            query: {id: d.id},
            model: each
          })
          let refetch = await Models[each].findOne({id: d.id})
          t.true(refetch === null)
        }
        // delete all taglike
        if (['catalogues', 'metadatas', 'relations', 'tags'].includes(name)) {
          for (let tt of T) {
            let result = await api({
              operation: '-',
              query: {id: tt.id},
              model: tagModel
            })
            let refetch = await Models[tagModel].findOne({id: tt.id})
            t.true(refetch === null)
          }
        }
      }
    }
  }
  t.pass()
})
test.skip('tag origin system', async t => {
  let Models = globals.Models
  let WithsDict = globals.WithsDict
  let All = globals.All
  let apis = [
    {name: 'relations', withname: 'WithRelation', model:'Relation'},
    {name: 'metadatas', withname: 'WithMetadata', model:'Metadata'},
    {name: 'catalogues', withname: 'WithCatalogue', model:'Catalogue'},
    {name: 'tags', withname: 'WithTag', model:'Tag'},
  ]
  const pstep = false
  for (let apiname of apis) {
    let {name, withname, model: tagModel} = apiname
    console.log(`test ${name}`)
    let todos = WithsDict[withname]
    for (let each of todos) {
      if (pstep) console.log(`... ${each}`)
      let Model = Models[each]
      let pks = getRequire(Model)
      let data, refetch, refetch_, result, id, ids, updated, tt
      let taglike, newtaglike, deltaglike, rawdata, toDelete, tname
      let getNewTaglike, getDelTaglike, modifyMap, getOtherData, input
      let __
      let testFunctions = {}
      let testDatas = {}
      let omitnames = [name]
      let D = []
      let T = []
      let N = 15
      let TN = 10
      if('setup') {
        // create N+1 articles, only create N-1 of them, D[0] is created later
        for (let i=0; i<=N; i++) {
          data = {
            comment: `${i} ${each} ${name} test`,
            flags: { debug: true }
          }
          if (pks.length) {
            for (let pk of pks) {
              data[pk] = `${i} ${each} ${name} test`
            }
          }
          rawdata = Object.assign({}, data)
          D.push(rawdata)
        }
        for (let i=0; i<=N; i++) {
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
        // create Taglike
        for (let index=0; index<=TN; index++) {
          T.push({
            name: `${each}-${name}-${index}`,
            comment: `comment for index ${index}`
          })
        }
        for (let each of T) {
          let result = await api({
            operation: '+',
            data: each,
            model: tagModel
          })
          let id = result.modelID
          each.id = id
        }
        tt = T[0]
      }
      // test
      if('start test') {
        if('add 1 without origin(id=manual)'){

        }
        if('add 3, one is the same as last one, the others are the same'){
          // after that we should have two subentry with the origin id=manual

        }
        if('add 2 with origin.id = auto'){

        }
      }
      if('clean up') {
        // delete N articles
        for (let d of D) {
          let entry = await api({
            operation: 'findOne',
            query: {id: d.id},
            model: each
          })
          if (!entry) continue
          let result = await api({
            operation: '-',
            query: {id: d.id},
            model: each
          })
          let refetch = await Models[each].findOne({id: d.id})
          t.true(refetch === null)
        }
        // delete all taglike
        for (let tt of T) {
          let result = await api({
            operation: '-',
            query: {id: tt.id},
            model: tagModel
          })
          let refetch = await Models[tagModel].findOne({id: tt.id})
          t.true(refetch === null)
        }
      }
    }
  }
  t.pass()
})
test.skip('reverse delete for taglike', async t => {
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
test.skip('bulkAdd without hooks', async t => {
  let Relations, R, r, Tags, T
  if("bulk add Relations") {
    Relations = [
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
    R = {}
    r = await bulkAdd({model: 'Relation', data: Relations})
    for (let index in r) {
      let id = r[index].id
      let each = Relations[index]
      each.id = id
      let namesplits = each.name.split('-')
      let name = namesplits[namesplits.length - 1]
      R[name] = each
    }
  }
  if('bulk add Tags, test complicated-tags'){
    Tags = [
      {
        name: t.title + '-astronomy'
      },
      {
        name: t.title + '-galaxy',
        relations: [
          {
            relation: { name: R.CN2EN.name },
            from: { name: t.title + '-xingxi' }
          }
        ],
        fathers: [
          { name: t.title + '-astronomy'}
        ]
      },
      {
        name: t.title + '-xingxi'
        // should auto add {family, relations}
      },
    ]
  }
  t.pass()
})

// add test files in plugins
test('all plugin have test file', async t => {
  const pluginRoot = path.join(__dirname, 'server', 'plugins')
  let pluginNames = fs.readdirSync(pluginRoot)
  let testFiles = []
  let fileCount = 0
  for (let filename of pluginNames) {
    let pluginDir = path.join(pluginRoot, filename)
    if (!fs.statSync(pluginDir).isDirectory()) continue
    let testFile = path.join(pluginDir, 'test.js')
    if (!fs.existsSync(testFile)) {
      t.fail(`plugin ${filename} do not have a test file !`)
      fileCount += 1
    } else {
      testFiles.push(testFile)
    }
  }
  t.pass()
})
