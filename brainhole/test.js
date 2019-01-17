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
    let path = `${each}-metadatas`
    let Model = Models[each]
    let pks = getRequire(Model)
    let data, refetch, refetch_, result, id, updated, tfetch
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
        flags: {debug: true, test: false, ttest: false}
      },
      {
        metadata: {
          name: t.title + '-rate'
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
    let copy = metadatas.map(_ => Object.assign({}, _))
    result = await api({
      operation: '+',
      data: { metadatas: copy },
      model: each,
      query: {id},
      field: 'metadatas',
    })
    t.true(result.through.length === metadatas.length)
    tfetch = await Models.Through.find({path}); t.true(tfetch.length === metadatas.length)
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch)
    updated = result.withs.metadatas.map(__ => _.omit(__, ['metadata']) )
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

    // create in one dict
    data.metadatas = copy
    result = await api({
      operation: '+',
      data,
      model: each
    })
    t.true(result.through.length === metadatas.length)
    tfetch = await Models.Through.find({path}); t.true(tfetch.length === metadatas.length)
    id = result.modelID
    refetch = await Model.findOne({id})
    refetch = refetch._doc

    refetch_ = Object.assign({}, refetch)
    updated = metadatas.map(__ => _.omit(__, ['metadata']) )
    for (let index in updated) {
      Object.assign(refetch_.metadatas[index], updated[index])
    }
    t.deepEqual(refetch, refetch_)

    // modify both simple and withs
    updated = result.withs.metadatas
    data.comment = `${each} ${t.title} modified`
    data.flags.in_trush = false
    data.flags.ddebug = true
    let newmetadatas = [
      { // [1]
        id: updated[1].id,
        value: 'test color string updated',
        comment: 'test comment updated',
        flags: {
          add_new_flag: true
        }
      },
      { // [3] only this one can modify with name, others have dupoicated term
        metadata: {
          name: t.title + '-object2'
        },
        __query__: {
          metadata: {
            name: t.title + '-object'
          },
        },
        value: {msg: 'mixed_value modify', mixed_value_add: true},
        comment: 'test comment',
        flags: {debug: 'change to false'}
      },
      { // [2]
        __query__: {
          metadata_id: updated[2].metadata_id,
        },
        value: 'test rate string 2 modified',
        comment: 'new comment',
        flags: {debug: false, add_new_flag: true}
      },
    ]
    data.metadatas = newmetadatas
    result = await api({
      operation: '*',
      data,
      model: each,
      query: {id}
    })
    t.true(result.through.length === 1)
    tfetch = await Models.Through.find({path})
    t.true(tfetch.length === metadatas.length)
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch)
    Object.assign(refetch_, _.omit(data, ['metadatas']))
    updated = newmetadatas.map(__ => _.omit(__, ['__query__']) )
    Object.assign(refetch_.metadatas[1], updated[0])
    Object.assign(refetch_.metadatas[3], updated[1])
    Object.assign(refetch_.metadatas[2], updated[2])
    t.deepEqual(refetch, refetch_)

    // modify with fields
    updated = result.withs.metadatas
    newmetadatas = [
      { // [1]
        id: updated[0].id,
        value: 'test color string updated with field',
        comment: 'test comment updated with field',
        flags: {
          add_new_flag: true, update_with_field: true
        }
      },
      { // [3] only this one can modify with name, others have dupoicated term
        metadata: {
          name: t.title + '-object'
        },
        __query__: {
          metadata: {
            name: t.title + '-object2'
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
        flags: {debug: 'balbal', add_new_flag: false, modify_with_field: true}
      },
    ]
    data.metadatas = newmetadatas
    result = await api({
      operation: '*',
      data: {metadatas: newmetadatas},
      model: each,
      query: {id},
      field: 'metadatas'
    })
    t.true(result.through.length === 1)
    tfetch = await Models.Through.find({path})
    t.true(tfetch.length === metadatas.length)
    refetch = await Model.findOne({id})
    refetch = refetch._doc
    refetch_ = Object.assign({}, refetch)
    Object.assign(refetch_, _.omit(data, ['metadatas']))
    updated = newmetadatas.map(__ => _.omit(__, ['__query__']) )
    Object.assign(refetch_.metadatas[1], updated[0])
    Object.assign(refetch_.metadatas[3], updated[1])
    Object.assign(refetch_.metadatas[2], updated[2])
    t.deepEqual(refetch, refetch_)

    // delete metadata only
    updated = result.withs.metadatas
    let toDelete = [
      { // [1]
        id: updated[0].id,
      },
      { // [3] only this one can modify with name, others have dupoicated term
        __query__: {
          metadata: {
            name: t.title + '-object'
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
    t.true(result.through.length === toDelete.length)
    tfetch = await Models.Through.find({path})
    t.true(tfetch.length === metadatas.length - toDelete.length)
    refetch = await Model.findOne({id})
    refetch = refetch._doc.metadatas
    let ids = updated.map(_=>_.id)
    refetch_ = refetch.filter(_ => ids.includes(_.id))
    t.is(refetch_.length, 0)

    // delete flags in metadata
    toDelete = refetch.map(__ => _.pick(__, ["id", "flags"]))
    toDelete = toDelete.slice(1,) // only the later two have flags
    delete toDelete[0].flags.debug
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
    t.is(refetch[0].flags.debug, true)

    // delete the entry, clean up
    let oldresult = result
    result = await api({
      operation: '-',
      model: each,
      query: {id}
    })

    t.true(result.through.length === oldresult.result.metadatas.length)
    tfetch = await Models.Through.find({path})
    t.true(tfetch.length === 0)

    refetch = await Model.findOne({id})
    t.true(refetch === null)
    break
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
