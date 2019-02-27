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
    let path = `${each}-metadatas`
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

    if("create and modify with data.metadatas") {
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
