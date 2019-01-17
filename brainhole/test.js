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

global.d.env = 'test'

function getRequire (Model) {
  let tree = Model.schema.tree
  let fields = Object.keys(tree)
  let good = fields.filter(_ => tree[_].required)
  return good
}

test.before('init database', async t => {
  globalConfig.demoData = false
  await database_init({config: globalConfig, databaseConfig})
  t.pass()
})

test.skip('basic', async t => {
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
    refetch = await Model.findOne({id})
    refetch = refetch._doc
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
    refetch = await Model.findOne({id})
    refetch = refetch._doc
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

test.skip('flags', async t => {
  let todos = WithsDict.WithFlag
  for (let each of todos) {
    let Model = Models[each]
    let pks = getRequire(Model)
    let data, refetch, refetch_, result, id
    data = {
      comment: `${each} ${t.title} test`,
    }
    if (pks.length) {
      for (let pk of pks) {
        data[pk] = `${each} ${t.title} test`
      }
    }
    // create without flag, add it use api with 'field' parameter
    result = await api({
      operation: '+',
      data,
      model: each
    })
    id = result.modelID
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    let flags = {
      debug: true,
      in_trush: true,
    }
    result = await api({
      operation: '+',
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
      operation: '-',
      model: each,
      query: {id}
    })
    refetch = await Model.findOne({id})
    t.true(refetch === null)
    // create with flag
    data.flags = flags
    result = await api({
      operation: '+',
      data,
      model: each
    })
    id = result.modelID
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
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
      operation: '*',
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
      operation: '-',
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
      operation: '-',
      model: each,
      query: {id}
    })
    refetch = await Model.findOne({id})
    t.true(refetch === null)
  }
  t.pass()
})

test('metadata+flags', async t => {
  // init Metadatas
  let Metadatas = [
    {name: t.title + '-rate', format: 'string'},
    {name: t.title + '-color', format: 'color'},
    {name: t.title + '-count', format: 'number'},
    {name: t.title + '-object', format: 'object'},
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
    let Model = Models[each]
    let pks = getRequire(Model)
    let data, refetch, refetch_, result, id
    data = {
      comment: `${each} ${t.title} test`,
    }
    if (pks.length) {
      for (let pk of pks) {
        data[pk] = `${each} ${t.title} test`
      }
    }
    // create top models and then add metadata using fields
    result = await api({
      operation: '+',
      data,
      model: each
    })
    id = result.modelID
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
    let flags = {
      debug: true,
      in_trush: true,
    }
    let metadatas = [
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
        flags: {debug: true}
      },
      //{name: t.title + '-rate', format: 'string'},
      //{name: t.title + '-color', format: 'color'},
      //{name: t.title + '-count', format: 'number'},
      //{name: t.title + '-object', format: 'object'},
      {
        metadata: {
          name: t.title + '-rate'
        },
        value: 'test rate string 2',
        flags: {debug: true}
      },
      {
        metadata: {
          id: Metadatas[1].id
        },
        value: 'test color string 2',
        flags: {debug: true}
      },
      {
        metadata: {
          name: t.title + '-count'
        },
        value: 233333333333,
        flags: {debug: true}
      },
    ]
    let copy = metadatas.map(_ => Object.assign({}, _))
    result = await api({
      operation: '+',
      data: { metadatas: copy },
      model: each,
      query: {id},
      field: 'metadatas',
    })
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch)
    let updated = result.withs.metadatas.map(__ => _.omit(__, ['metadata']) )
    for (let index in updated) {
      Object.assign(refetch_.metadatas[index], updated[index])
    }
    t.deepEqual(refetch, refetch_)
    // delete it
    result = await api({
      operation: '-',
      model: each,
      query: {id}
    })
    refetch = await Model.findOne({id})
    t.true(refetch === null)

    continue

    // create with flag
    data.flags = flags
    result = await api({
      operation: '+',
      data,
      model: each
    })
    id = result.modelID
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch, data)
    t.deepEqual(refetch, refetch_)
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
      operation: '*',
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
      operation: '-',
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
      operation: '-',
      model: each,
      query: {id}
    })
    refetch = await Model.findOne({id})
    t.true(refetch === null)
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
