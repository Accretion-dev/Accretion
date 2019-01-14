import debugSettings from './server/debug-settings-test'
import globalConfig from "./configs/config.js"
import yaml from 'node-yaml'
let config = require('./nuxt.config.js')
let databaseConfig = yaml.readSync('../configs/mongod.yml')
import database_init from './server/models'
import __ from './server/models/models'
const {Models, api, WithsDict, All} = __
import test from 'ava'

function getRequire (Model) {
  let tree = Model.schema.tree
  let fields = Object.keys(tree)
  let good = fields.filter(_ => tree[_].required)
  return good
}

test.before('init database', async t => {
  globalConfig.unittest = false
  await database_init({config: globalConfig, databaseConfig})
  t.pass()
})

test('basic', async t => {
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
      operation: 'create',
      data,
      model: each
    })
    let id = result.result.simple.id
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    // modify
    data = {
      comment: `${each} basic modified`
    }
    result = await api({
      operation: 'modify',
      data,
      model: each,
      query: {id}
    })
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    // delete
    result = await api({
      operation: 'delete',
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
    let data, refetch, refetch_, result, id
    data = {
      comment: `${each} basic test`,
    }
    if (pks.length) {
      for (let pk of pks) {
        data[pk] = `${each} basic test`
      }
    }
    // create without flag, add it use api with 'field' parameter
    result = await api({
      operation: 'create',
      data,
      model: each
    })
    id = result.result.simple.id
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    let flags = {
      debug: true,
      in_trush: true,
    }
    result = await api({
      operation: 'create',
      data: {flags},
      model: each,
      query: {id},
      field: 'flags',
    })
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, {flags})
    t.deepEqual(refetch, refetch_)
    // delete it
    result = await api({
      operation: 'delete',
      model: each,
      query: {id}
    })
    refetch = await Model.findOne({id})
    t.true(refetch === null)
    // create with flag
    data.flags = flags
    result = await api({
      operation: 'create',
      data,
      model: each
    })
    id = result.result.simple.id
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    // modify both simple and withs
    data.comment = `${each} basic modified`
    data.flags.in_trush = false
    data.flags.ddebug = true
    result = await api({
      operation: 'modify',
      data,
      model: each,
      query: {id}
    })
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    // only modify withs
    flags = data.flags
    flags.in_trush = 3
    flags.debug = 4
    flags.debugg = 5
    result = await api({
      operation: 'modify',
      data:{flags},
      model: each,
      query: {id},
      field: 'flags'
    })
    // delete flags only
    let toDelete = {in_trush: true, debug: true}
    for (let name of Object.keys(toDelete)) {
      delete flags[name]
    }
    result = await api({
      operation: 'delete',
      data: {flags: toDelete},
      model: each,
      query: {id},
      field: 'flags'
    })
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    // delete the entry, clean up
    result = await api({
      operation: 'delete',
      model: each,
      query: {id}
    })
    refetch = await Model.findOne({id})
    t.true(refetch === null)
  }
  t.pass()
})
