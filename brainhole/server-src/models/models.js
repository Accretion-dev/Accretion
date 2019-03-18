import mongoose from 'mongoose'
import models from './default'
import _ from 'lodash'
import passportLocalMongoose from 'passport-local-mongoose'
import globals from "../globals"
let Schema = mongoose.Schema
let todo
let modelsRaw = models

// first create these base models, they do not have withs
let SchemasRaw = { }
// this special Models are not modified by APIs
let special = [
  'IDs',
  'History',
  'User',
  'Plugins',
]
let others = [
  'Config', 'UserConfig',
  'Editing', 'Workspace'
]
const simpleModels = [...others, special]
// add id and comment for all of them
todo = [...others, ...special]
todo.forEach(key => {
  let Model = models[key]
  Object.assign(Model.schema, {
    id: { type: Number, auto: true },
    comment: { type: String },
    origin: [{ type: Schema.Types.Mixed }],
    // should not have index for these special models
    // or you will get 'background operations' errors in unittest because
    // you are dropping collections while building indexes on them
  })
})
// should not modify history and user through API
todo = [...others, ...special]
todo.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  SchemasRaw[key] = new Schema(schemaDict, {collection: key})
})
// plugin user
SchemasRaw.User.plugin(passportLocalMongoose)
let ModelsRaw = {}
todo.forEach(key => {
  ModelsRaw[key] = mongoose.model(key, SchemasRaw[key])
})
globals.Models = ModelsRaw
globals.Schemas = SchemasRaw

let formatMap = new Map()
formatMap.set(String, 'string')
formatMap.set(Boolean, 'boolean')
formatMap.set(Date, 'date')
formatMap.set(Schema.Types.Mixed, 'object')
formatMap.set(Number, 'id')
// TODO: supported format
let metadataFormats = {
  'id': { type: String },
  'color': { type: String },
  'url': { type: String },
  'location': { type: String },
  'path': { type: String },
  'image': { type: String },
  'video': { type: String },
  'audio': { type: String },
  'int': { type: String },
  'real': { type: String },
  'string': { type: String },
  'intervalInt': { type: String },
  'intervalReal': { type: String },
  'datetime': { type: String },
  'date': { type: String },
  'time': { type: String },
  'bool': { type: Boolean },
}

// stringify structTree
function stringifyStructTree (input) {
  let result = {}
  if (input instanceof Schema) {
    let keys = Object.keys(input.tree)
    keys = keys.filter(_ => _ !== '__v')
    keys = keys.filter(_ => !(input.tree[_] instanceof mongoose.VirtualType))
    keys.forEach(key => {
      result[key] = stringifyStructTree(input.tree[key])
    })
    return result
  } else if (Array.isArray(input)) {
    return [stringifyStructTree(input[0])]
  } else {
    let keys = Object.keys(input)
    if (keys.includes('type') && typeof(input.type) === 'function') {
      return formatMap.get(input.type)
    } else {
      keys.forEach(key => {
        result[key] = stringifyStructTree(input[key])
      })
      return result
    }
  }
}
// model init function
function initModels () {
  let Models = Object.assign({}, ModelsRaw)
  let Schemas = Object.assign({}, SchemasRaw)
  let models = Object.assign({}, modelsRaw)

  let modelFromPlugins = globals.pluginsData.model.map(_ => _.uid)
  for (let model of globals.pluginsData.model) {
    models[model.uid] = model
  }

  let top = [
    'Article',
    'Website',
    'File',
    ...modelFromPlugins
  ]

  let WithTag = [...top]
  let WithCatalogue = [...top]
  let WithRelation = [...top, 'Tag']
  let TagLike = ['Tag', 'Catalogue', 'MetaData', 'Relation']
  let WithFather = [...top, 'Tag', 'Catalogue']
  let WithChild = [...top, 'Tag', 'Catalogue']
  let WithMetadata = [...WithFather] // and all nested fields
  let modelAll = [...WithMetadata, 'Metadata', 'Relation']
  let WithFlag = [...modelAll] // and all nested fields
  let All = [...modelAll, ...others]
  let AllWithUser = [...modelAll, 'UserConfig']
  let AllWithTimeComment = [...modelAll]
  let WithR = [
    'Tag',
    'Catalogue',
    'Relation',
    'Metadata',
  ]
  let WithsDict = {
    WithTag,
    WithCatalogue,
    WithRelation,
    WithFather,
    WithChild,
    WithMetadata,
    WithFlag,
    WithR,
  }
  // Extro fields of each fields
  // e.g. {'Article': ["tags", "catalogues"...]...}
  let Withs = {}
  All.forEach(key => Withs[key] = [])
  Object.keys(WithsDict).forEach(key => {
    let fieldName = key.slice(4).toLowerCase()
    if (fieldName === 'child') {
      fieldName = fieldName + 'ren'
    } else if (fieldName === 'r') {
      fieldName = 'r'
    } else {
      fieldName = fieldName + 's'
    }
    WithsDict[key].forEach(eachmodel => {
      Withs[eachmodel].push(fieldName)
    })
  })

  let schemaData

  // compile all schemas
  let foreignSchemas = {
    User: {
      username: { type: String }
    }
  }
  let subSchema = {}
  // tags, catalogues
  let todos = ['Tag', 'Catalogue']
  todos.forEach(ModelName => {
    let type = ModelName.toLowerCase()
    let withName = `With${ModelName}`
    schemaData = {
      [type+"_id"]: { type: Number },
    }
    subSchema[type] = new Schema(schemaData)
    WithsDict[withName].forEach(key => {
      let Model = models[key]
      let schemaDict = Model.schema
      schemaDict[`${type}s`] = [subSchema[type]]
    })
  })
  // relations
  schemaData = {
    relation_id: { type: Number },
    parameter: { type: Schema.Types.Mixed },
    from_model: { type: String },
    from_id: { type: Number },
    to_model: { type: String },
    to_id: { type: Number },
    other_model: { type: String },
    other_id: { type: Number },
    aorb: { type: String },
  }
  subSchema.relation = new Schema(schemaData)
  WithRelation.forEach(key => {
    let Model = models[key]
    let schemaDict = Model.schema
    schemaDict.relations = [subSchema.relation]
  })
  // family
  schemaData = {
    id: { type: Number },
  }
  subSchema.family = new Schema(schemaData)
  WithFather.forEach(key => {
    let Model = models[key]
    let schemaDict = Model.schema
    schemaDict.fathers = [subSchema.family]
  })
  WithChild.forEach(key => {
    let Model = models[key]
    let schemaDict = Model.schema
    schemaDict.children = [subSchema.family]
  })
  // metadatas (for WithMetadata and subSchema)
  schemaData = {
    metadata_id: { type: Number },
    value: { type: Schema.Types.Mixed },
  }
  subSchema.metadata = new Schema(schemaData)
  WithMetadata.forEach(key => {
    let Model = models[key]
    let schemaDict = Model.schema
    schemaDict.metadatas = [subSchema.metadata]
  })
  // flags (for WithFlags and subSchema)
  WithFlag.forEach(key => {
    let Model = models[key]
    let schemaDict = Model.schema
    schemaDict.flags = { type: Schema.Types.Mixed, default: {} }
  })
  Object.keys(subSchema).forEach(key => { // all subSchema except fathers and child have flags
    if (['fathers', 'children', 'family'].includes(key)) return
    let Model = subSchema[key]
    Model.add({flags:{ type: Schema.Types.Mixed, default: {} }})
  })
  // add user
  AllWithUser.forEach(key => {
    let Model = models[key]
    let schemaDict = Model.schema
    schemaDict.user = foreignSchemas.User
  })
  // add comment, createdAt, modifiedAt, id for All and subSchema
  let extras = {
    id: { type: Number, auto: true },
    comment: { type: String, index: true },
    origin: [{ type: Schema.Types.Mixed }],
  }
  All.forEach(key => {
    let Model = models[key]
    Object.assign(Model.schema, extras)
  })
  Object.keys(subSchema).forEach(key => {
    if (['history', 'family'].includes(key)) return // not add for these models
    let Model = subSchema[key]
    Model.add(extras)
  })
  extras = {
    createdAt: { type: Date, default: Date.now },
    modifiedAt: { type: Date, default: Date.now },
  }
  AllWithTimeComment.forEach(key => {
    let Model = models[key]
    Object.assign(Model.schema, extras)
  })
  Object.keys(subSchema).forEach(key => {
    if (['family'].includes(key)) return // not add for these models
    let Model = subSchema[key]
    Model.add(extras)
  })
  extras = { // about autoadd and hooks
    origin: [{ type: String }],
  }
  Object.keys(subSchema).forEach(key => {
    let Model = subSchema[key]
    Model.add(extras)
  })
  // generate reverse field for Tag, Metadata, Relation and Catalogue
  let todo =['Tag', 'Catalogue', 'Relation', 'Metadata']
  for (let key of todo) {
    let Model = models[key]
    let schemaDict = Model.schema
    schemaData = {}
    for (let refkey of WithsDict[`With${key}`]) {
      schemaData[refkey] = [{type: String}]
    }
    schemaDict.r = schemaData
  }

  // 6. generate schemas
  modelAll.forEach(key => {
    let Model = models[key]
    let schemaDict = Model.schema
    Schemas[key] = new Schema(schemaDict, {collection: key})
  })
  let structTree = globals.structTree = stringifyStructTree(Schemas)

  // generate models
  modelAll.forEach(key => {
    Models[key] = mongoose.model(key, Schemas[key])
  })
  globals.Models = Models
  globals.Schemas = Schemas

  globals.Withs = Withs
  globals.WithsDict = WithsDict
  globals.subSchema = subSchema
  globals.All = All
  if (globals.isMain) {
    console.log('model info:', _.pick(globals, ['Withs', 'subSchema', 'structTree', 'Models', 'WithsDict']))
  }

  globals.api = api
  globals.mongoose = mongoose

  return {Models, Schemas, structTree, globals, All, Withs, WithsDict}
}

// _id of new top model and its submodel
async function getNextSequenceValue(name) {
  let doc = await mongoose.connection.db.collection('IDs').findOneAndUpdate(
    {name},
    {$inc: {count: 1}}
  )
  return doc.value.count
}

let SubWiths = {
  'metadatas': ['flags'],
  'tags': ['flags'],
  'catalogues': ['flags'],
  'relations': ['flags'],
}
async function queryTaglikeID ({field, query, test, getEntry, session, entry_model}) {
  let Models = globals.Models
  // fullquery delete the query_key, only have query_key_id
  // query for foreignField if do not know id, else just include id
  let query_id, rawquery, fullquery, query_entry
  let query_key = field.slice(0, -1) // tags, catalogues, relations, metadatas
  if (!(query_key in query || query_key+"_id" in query)) {
    // do not change taglike, no need to query for the new one
    if (test) {
      return {full_tag_query: query, raw_tag_query: Object.assign({}, query)}
    } else {
      throw Error(`should have ${query_key} or ${query_key}_id, data:${JSON.stringify(query,null,2)}`)
    }
  }
  let this_tag_model = query_key[0].toUpperCase() + query_key.slice(1)
  // query_id is the id we want
  // raw_query is the input query
  // fullquery is raw_query + {query_id}
  if (query_key+"_id" in query) {
    query_id = query[query_key+"_id"]
    rawquery = Object.assign({}, query)
    fullquery = query
    if (getEntry) {
      let r = await Models[this_tag_model].find({id: query_id}).session(session)
      if (r.length !== 1) throw Error(`not single result when query ${query_key} with ${{id: query_id}} in ${this_tag_model}`)
      query_entry = r[0]
    }
  } else if (query_key in query) {
    fullquery = query
    query = query[query_key]
    if ('id' in query) {
      query_id = query['id']
      if (getEntry) {
        let r = await Models[this_tag_model].find({id: query_id}).session(session)
        if (r.length !== 1) throw Error(`not single result when query ${query_key} with ${{id: query_id}} in ${this_tag_model}`)
        query_entry = r[0]
      }
    } else {
      let r = await Models[this_tag_model].find(query).session(session)
      if (r.length !== 1) throw Error(`not single result when query ${query_key} with ${JSON.stringify(query)} in ${this_tag_model}\n${JSON.stringify(r)}`)
      query_entry = r[0]
      query_id = query_entry.id
    }
    fullquery[query_key+"_id"] = query_id
    rawquery = Object.assign({}, fullquery)
    delete fullquery[query_key]
  }
  if (field === 'relations') {
    if (!fullquery.to_id && fullquery.to) {
      let to_model = fullquery.to_model
      if (!to_model) to_model = entry_model
      let to = fullquery.to
      let r = await Models[to_model].find(to).session(session)
      if (r.length !== 1) throw Error(`not single result when query ${to_model} with ${to}, r:${r}`)
      to = r[0]
      fullquery.to_id = to.id
      delete fullquery.to
    }
    if (!fullquery.from_id && fullquery.from) {
      let from_model = fullquery.from_model
      if (!from_model) from_model = entry_model
      let from = fullquery.from
      let r = await Models[from_model].find(from).session(session)
      if (r.length !== 1) throw Error(`not single result when query ${from_model} with ${JSON.stringify(from,null,2)}, fullquery:${JSON.stringify(fullquery,null,2)}, r:${r}`)
      from = r[0]
      fullquery.from_id = from.id
      delete fullquery.from
    }
  }
  return {tag_query_id: query_id, raw_tag_query: rawquery, full_tag_query: fullquery, tag_query_entry: query_entry}
}

async function saveHistory(returnData, session) {
  let history = new globals.Models.History(returnData);
  history.$session(session);
  // console.log('saveing:', _.pick(returnData, ['operation', 'modelID', 'data', 'query']))
  await history.save();
  // console.log('saved:', _.pick(returnData, ['operation', 'modelID', 'data', 'query']))
  return history
}

// all APIs
async function querySub({entry, data, field, session}) {
  // query subdocument in a subdocument array (like tags, metadatas)
  let result, rawquery, fullquery
  let query_key = field.slice(0, -1) // tags, catalogues, relations, metadatas
  if ('id' in data) {
    result = entry[field].find(_ => _.id === data.id )
    if (!result)
      throw Error(`id ${data.id} not exists in ${field}\nentry:${JSON.stringify(entry,null,2)}\ndata:${JSON.stringify(entry,null,2)}\nfield:${field}`)
    return result
  } else if ('__query__' in data) {
    fullquery = Object.assign({}, data)
    let query = data.__query__
    delete fullquery.__query__

    let {tag_query_id} = await queryTaglikeID({field, query, session})
    // search for xxxxs
    result = entry[field].filter(_ => _[query_key+'_id'] === tag_query_id )
    if (result.length !== 1) {
      if (!(result.length)) {
        let currentData = entry[field].map(__ => (_.pick(__, ['id', query_key+"_id"])))
        throw Error(`query:${JSON.stringify(query)} not found in ${field}, current data:${JSON.stringify(currentData, null, 2)}`)
      } else {
        throw Error(`query:${query} more than one in ${field}`)
      }
    }
    return result[0]
  } else {
    throw Error(`do not have 'id' or '__query__' in ${field}, don't know how to query, entry:${entry}, data:${JSON.stringify(data)}`)
  }
}
function extractSingleField ({model, field, data, sub}) {
  let fieldPrefix, fieldSuffix, newdata
  let thisWiths = sub ? SubWiths : globals.Withs
  if (field.indexOf('.') >= 0)  {
    [fieldPrefix, ...fieldSuffix] = field.split('.')
    fieldSuffix = fieldSuffix.join('.')
  } else {
    fieldPrefix = field
    fieldSuffix = ''
  }
  newdata = data[fieldPrefix]
  if (!newdata) throw Error(`should provide data with field: ${field} in model ${model}`)
  if (!thisWiths[model].includes(fieldPrefix)) throw Error(`no field ${field} found in model ${model}, ${sub}`)
  if (!APIs[`${fieldPrefix}API`]) throw Error(`Do not have api for ${field}`)
  return {newdata, fieldPrefix, fieldSuffix}
}
async function apiSingleField ({operation, model, field, data, entry, query, meta, session, origin}) {
  let withs, simple, result
  let flags = {}

  let {fieldPrefix, fieldSuffix, newdata} = extractSingleField({model, field, data})
  let thisresult = await APIs[`${fieldPrefix}API`]({operation, prefield: model+`-${fieldPrefix}`, field: fieldSuffix, entry, data: newdata, session, origin})

  withs = {[fieldPrefix]: thisresult}
  simple = await entry.save()
  result = simple
  let modelID = simple.id

  // hooks
  let hooks = globals.pluginsData.hook[model]
  if (hooks && hooks.length) {
    for (let hook of hooks) {
      if (hook.test && !hook.test({operation, entry: entry._doc, field})) continue
      await hook({operation, entry:result._doc})
    }
  }

  let returnData = {operation, modelID, model, field, data, query, result, withs, meta, origin, flags}
  // let history = new globals.Models.History(returnData); history.$session(session); await history.save();
  let history = await saveHistory(returnData, session)
  return returnData
}

function extractWiths ({ data, model, sub }) {
  // seperate simple field and complicated fileds (with WithXXXApi)
  // if sub, data is already a subdocument, search recursively (e.g., flags in tags in article)
  let thisWiths
  if (sub) {
    thisWiths = SubWiths
  } else {
    thisWiths = globals.Withs
  }
  let withs = thisWiths[model]
  if (!withs.length) {
    return {
      simple: Object.assign({}, data),
      withs: {},
    }
  }
  withs = new Set(withs)
  let keys = new Set(Object.keys(data))
  let result = {
    simple: {},
    withs: {},
  }
  keys.forEach(key => {
    if (withs.has(key)) {
      result.withs[key] = data[key]
    } else {
      result.simple[key] = data[key]
    }
  })
  return result
}
async function processWiths ({ operation, prefield, field, entry, withs, sub, session, origin}) {
  // modify subdocument(or subsubdocument) for each model
  let thisWiths // what field to process
  if (operation === '-') { // delete all withs before delete the main entry
    if (sub) {
      thisWiths = SubWiths[sub]
    } else {
      thisWiths = globals.Withs[prefield]
    }
  } else { // only add/modify given withs
    thisWiths = Object.keys(withs)
  }
  let result = {}
  for (let key of thisWiths) {
    if (operation === '-') { // only delete non empty subfields
      if (!entry[key]) continue
      if (Array.isArray(entry[key]) && !(entry[key].length)) continue
    } else { // only add/modify valiad input subdocument
      if (!withs[key]) continue
    }
    let api = `${key}API`
    let thisresult = await APIs[api]({
      operation,
      prefield: prefield+`-${key}`, // record parent entry
      field,
      entry,
      data: withs[key],
      session,
      origin
    })
    result[key] = thisresult
  }
  return result
}
async function api({ operation, data, query, model, meta, field, session, origin }) {
  if (!session) session = await mongoose.startSession()
  try {
    session.startTransaction()
    let result = await apiSessionWrapper({ operation, data, query, model, meta, field, session, origin })
    await session.commitTransaction()
    return result
  } catch (error) {
    await session.abortTransaction()
    if (error.codeName === 'WriteConflict') {
      console.trace()
      console.log('write conflict debug info:', {operation, data, query, model, meta, field})
    }
    throw error
  }
}
async function apiSessionWrapper ({ operation, data, query, model, meta, field, session, origin }) {
  let Models = globals.Models
  let Model = mongoose.models[model]
  if (!Model) throw Error(`unknown model ${model}`)
  if (origin === undefined) origin = {id: 'manual', time:new Date()}
  let flags = {}

  if (operation === 'aggregate') { // search
    let result = await Model.aggregate(query).session(session)
    // result is query aggregate result
    return result
  } else if (operation === 'find') {
    let result = await Model.find(query).session(session)
    // result is query aggregate result
    return result
  } else if (operation === 'findOne') {
    let result = await Model.findOne(query).session(session)
    // result is query aggregate result
    return result
  } else if (operation === '+') {
    let entry
    if (query && !field) { // add with origin
      entry = await Model.findOne(query).session(session)
      // if entry matched, only update the origin
      if (entry) {
        if (!origin) throw Error('should have origin if query is not null in +')
        if (!Array.isArray(origin)) origin = [origin]
        if (!origin.length) throw Error('origin should not be none when add entry')
        let originIDs = origin.map(_ => _.id)
        let oldOriginIDs = entry.origin.map(_ => _.id)
        let addOrigin = []
        for (let eachorigin of origin) {
          if (!oldOriginIDs.includes(eachorigin.id)) {
            let toAdd = Object.assign({},
              eachorigin,
              {time: new Date()}
            )
            entry.origin.push(toAdd)
            addOrigin.push(toAdd)
          }
        }
        flags.origin = addOrigin
        flags.entry = false
        if (addOrigin.length) {
          await entry.save()
        }
        let modelID = entry.id
        let withs = null
        let result = entry

        let returnData = {operation, modelID, model, field, data, query, result, withs, meta, origin, flags}
        // let history = new globals.Models.History(returnData); history.$session(session); await history.save();
        let history = await saveHistory(returnData, session)
        return returnData
      } else {
        flags.entry = true
        if (!Array.isArray(origin)) origin = [origin]
        if (!origin.length) throw Error('origin should not be none when add entry')
        flags.origin = origin
      }
    } else {
      flags.entry = true
      if (!Array.isArray(origin)) origin = [origin]
      if (!origin.length) throw Error('origin should not be none when add entry')
      flags.origin = origin
    }
    if (!field) { // e.g, create new Article, with some initial Tag, Cataloge...
      let {simple, withs} = extractWiths({data, model})
      simple.id = await getNextSequenceValue(model) // do not use session for this function
      simple.origin = origin // setup origin
      let entry = new Model(simple); entry.$session(session)
      withs = await processWiths({operation, prefield: model, field, entry, withs, session, origin})

      let result = await entry.save()
      let modelID = result.id
      // hooks
      let hooks = globals.pluginsData.hook[model]
      if (hooks && hooks.length) {
        for (let hook of hooks) {
          if (hook.test && !hook.test({operation, entry: result._doc, field})) continue
          await hook({operation, entry:result._doc})
        }
      }

      let returnData = {operation, modelID, model, field, data, query, result, withs, meta, origin, flags}
      // let history = new globals.Models.History(returnData); history.$session(session); await history.save();
      let history = await saveHistory(returnData, session)
      return returnData
    } else { // e.g. add new tag, add new catalogues
      let entry = await Model.find(query).session(session)
      if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
      entry = entry[0]

      let result = await apiSingleField({operation, model, field, data, entry, query, meta, session, origin})
      return result
    }
  } else if (operation === '*') { // modify top models (simple fields and nested fields)
    let entry = await Model.find(query).session(session)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
    entry = entry[0]

    if (!field) {
      let {simple, withs} = extractWiths({data, model})
      entry.set(simple)
      let thisresult = await processWiths({operation, prefield: model, field, entry, withs, session, origin})
      withs = thisresult

      simple = await entry.save()
      let result = simple
      let modelID = result.id

      // hooks
      let hooks = globals.pluginsData.hook[model]
      if (hooks && hooks.length) {
        for (let hook of hooks) {
          if (hook.test && !hook.test({operation, entry: entry._doc, field})) continue
          await hook({operation, entry:result._doc})
        }
      }

      let returnData = {operation, modelID, model, field, data, query, result, withs, meta, origin, flags}
      // let history = new globals.Models.History(returnData); history.$session(session); await history.save();
      let history = await saveHistory(returnData, session)
      return returnData
    } else {
      let result = await apiSingleField({operation, model, field, data, entry, query, meta, session, origin})
      return result
    }
  } else if (operation === '-') {
    let entry = await Model.find(query).session(session)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${JSON.stringify(query,null,2)} not unique: ${entry}`)
    entry = entry[0]

    if (!field) {
      // if origin is null, delete it without doubt
      // but if origin is not null, only delete the origins
      if (!Array.isArray(origin)) origin = [origin]
      if (origin.length) {
        if (!Array.isArray(origin)) origin = [origin]
        let originIDs = origin.map(_ => _.id)
        let oldOrigin = entry.origin
        let originDeleted = oldOrigin.filter(_ => originIDs.includes(_.id))
        let originLeft = oldOrigin.filter(_ => !originIDs.includes(_.id))
        flags.origin = originDeleted
        if (originLeft.length) { // only delete this origin
          entry.origin = originLeft
          entry.markModified('origin')
          await entry.save()

          let result = entry
          let withs = null
          flags.entry = false

          let returnData = {operation, modelID, model, field, data, query, result, withs, meta, origin, flags}
          // let history = new globals.Models.History(returnData); history.$session(session); await history.save();
          let history = await saveHistory(returnData, session)
          return returnData
        } else {
          flags.entry = true
        }
      } else {
        flags.entry = true
        flags.origin = entry.origin
      }

      // delete this entry
      let withs = {}
      let thisresult = await processWiths({operation, prefield: model, field, entry, withs, session, origin: null}) // origin be null to delete all tags
      withs = thisresult

      let simple = await entry.remove()
      let result = simple
      let modelID = result.id

      // hooks
      let hooks = globals.pluginsData.hook[model]
      if (hooks && hooks.length) {
        for (let hook of hooks) {
          if (hook.test && !hook.test({operation, entry: entry._doc, field})) continue
          await hook({operation, entry:result._doc})
        }
      }

      let returnData = {operation, modelID, model, field, data, query, result, withs, meta, origin, flags}
      // let history = new globals.Models.History(returnData); history.$session(session); await history.save();
      let history = await saveHistory(returnData, session)
      return returnData
    } else {
      let result = await apiSingleField({operation, model, field, data, entry, query, meta, session, origin})
      return result
    }
  } else if (operation === 'o') {
    let entry = await Model.find(query).session(session)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
    entry = entry[0]

    // hooks
    let hooks = globals.pluginsData.hook[model]
    if (hooks && hooks.length) {
      for (let hook of hooks) {
        if (hook.test && !hook.test({operation, entry: entry._doc, field})) continue
        await hook({operation, entry:result._doc})
      }
    }

    if (!field) {
      throw Error(`for ${model}, can only reorder its Tags, Metadatas, Relations or Catalogues`)
    } else {
      let result = await apiSingleField({operation, model, field, data, entry, query, meta, session, origin})
      return result
    }
  } else {
    throw Error(`operation should be one of '+', '-', '*', 'a', 'f', 'o', not ${operation}`)
  }
}

async function flagsAPI ({operation, prefield, field, entry, data}) {
  // field should always be '' or undefined, because flags do not have subfields
  // prefield could be any
  if (field) throw Error('field should always be blank or undefined, debug it!')
  if (operation === '+') {
    entry.flags = Object.assign(entry.flags, data)
    entry.markModified('flags')
    return data
  } else if (operation === '*') {
    entry.flags = Object.assign(entry.flags, data)
    entry.markModified('flags')
    return data
  } else if (operation === '-') {
    let deleted = {}
    if (data) { // delete given flags
      let keys = Object.keys(data)
      for (let key of keys) {
        deleted[key] = entry.flags[key]
        delete entry.flags[key]
      }
      entry.markModified('flags')
    } else { // delete all flags
      deleted = entry.flags
      entry.flags = {}
    }
    return deleted
  } else if (operation === 'o') {
    throw Error('can not reorder a flag!')
  }
}
async function rAPI ({operation, prefield, field, entry, data}) {
  if (field) throw Error('field should always be blank or undefined, debug it!')
  if (operation !== '-') throw Error('can only delete r')
  let keys = Object.keys(entry._doc.r)
  let toDelete = []
  let relations = []
  for (let key of keys) {
    for (let each of entry.r[key]) {
      if (key === relations) {
        relations.push(each)
        toDelete.push(each)
      } else {
        toDelete.push(each)
      }
    }
  }
  return entry.r
}

async function DFSSearch({model, id, entry, path, type, session}) {
  let Models = globals.Models
  if (!entry) {
    let r = await Models[model].find({id}).session(session)
    if (r.length !== 1) throw Error(`not single result when query ${model} with ${id}\nmodel:${model} id:${id} entry:${entry}, path:${path}, type:${type}`)
    entry = r[0]
  }
  if (!entry[type] || entry[type].lenth === 0) return null // successfully terminate here
  let items = entry[type].map(_ => _.id)
  for (let id of items) {
    let next = [...path, id]
    if (path.includes(id)) return next
    let result = await DFSSearch({model, id, path:next, type, session})
    if (result) return result
  }
}
async function testFamilyLoop({model, entry, session}) {
  let cycle
  cycle = await DFSSearch({model, entry, path: [entry.id], type: 'fathers', session})
  if (cycle) return cycle.join("=>")
  cycle = await DFSSearch({model, entry, path: [entry.id], type: 'children', session})
  if (cycle) return cycle.join("<=")
  return false
}

async function familyAPI ({operation, prefield, field, entry, data, type, session, origin}) {
  // field should always be '' or undefined
  // prefield could be any
  // type must be fathers or chindren
  // returns:
  //  [{id: ...}, ...], add, deleted or reorderd family
  let result = []
  let model = entry.schema.options.collection
  if (field) throw Error('field should always be blank or undefined, debug it!')
  // direct query models
  let fullquerys = []
  if (operation !== 'o') {
    if (operation === '-' && !data) {
      data = entry[type]
    }
    for (let each of data) {
      let queryData
      if (each.id) {
        queryData = {id: each.id}
      } else {
        queryData = each
      }
      let r = await globals.Models[model].find(queryData).session(session)
      if (r.length !== 1) throw Error(`not single result when query ${model} with ${JSON.stringify(each,null,2)}\n${JSON.stringify(r),null,2}`)
      let anotherEntry = r[0]
      fullquerys.push({id: anotherEntry.id, anotherEntry})
    }
  }
  const reverseMap = {fathers: 'children', children: 'fathers'}
  let revType = reverseMap[type]
  if (operation === '+') {
    let reverseRelations = []
    for (let fullquery of fullquerys) {
      let anotherEntry = fullquery.anotherEntry
      delete fullquery.anotherEntry
      let index = entry[type].push(fullquery)
      result.push(fullquery)
      reverseRelations.push({anotherEntry, toPush: {id: entry.id}})
    }
    let loop = await testFamilyLoop({model, entry, session})
    if (loop) throw Error(`detect family loop for model ${model}, ${JSON.stringify(entry,null,2)}\nloop:${loop}`)
    // after test loop, add reverse family relation
    for (let eachJob of reverseRelations) {
      let {anotherEntry, toPush} = eachJob
      anotherEntry[revType].push(toPush)
      await anotherEntry.save()
    }
    return result
  } else if (operation === '*') {
    throw Error(`can not modify family`)
  } else if (operation === '-') {
    let reverseRelations = []
    for (let fullquery of fullquerys) {
      let anotherEntry = fullquery.anotherEntry
      delete fullquery.anotherEntry
      if (!entry[type].find(_ => _.id === fullquery.id)) throw Error(`id: ${entry.id} ${type}:${fullquery.id} not found, can not delete!`)
      entry[type] = entry[type].filter(_ => _.id != fullquery.id) // need proper API here
      anotherEntry[revType] = anotherEntry[revType].filter(_ => _.id !== entry.id)
      await anotherEntry.save()
      result.push(fullquery)
    }
    return result
  } else if (operation === 'o') {
    let oldIDs = entry[type].map(_ => _.id).sort()
    let newIDs = data.map(_ => _.id).sort()
    oldIDs.forEach((value, index) => {
      if (newIDs[index] !== value) throw Error(`${model} family reorder error: not the same IDs, ${oldIDs} v.s. ${newIDs}`)
    })
    let fullResult = entry[type].map(_ => _)
    newIDs = data.map(_ => _.id)
    newIDs.forEach((value, index) => {
      let thisresult = fullResult.find(_ => _.id === value)
      entry[type][index] = thisresult
    })
    entry.markModified(type)
    return newIDs.map(_ => ({id: _}))
  }
}
async function fathersAPI ({operation, prefield, field, entry, data, session, origin}) {
  return await familyAPI({operation, prefield, field, entry, data, type:'fathers', session})
}
async function childrenAPI ({operation, prefield, field, entry, data, session, origin}) {
  return await familyAPI({operation, prefield, field, entry, data, type:'children', session})
}
async function processAutoActions (auto_actions) {
  // make unique
  return auto_actions
}
async function taglikeAPI ({name, operation, prefield, field, data, entry, session, origin}) {
  let Models = globals.Models
  // tags, catalogues, metadatas, relations
  let hooks = globals.pluginsData.hook[name]
  const query_key = name.slice(0,-1)+'_id' // key to query subdocument array, e.g. tag_id in tags field
  let tpath = prefield
  let tmodel = name[0].toUpperCase() + name.slice(1,-1)
  let result = []
  let entry_model = entry.schema.options.collection
  let entry_id = entry.id
  let other_entry
  let auto_actions = {
    add: [],
    del: [],
  }

  if (field) { // e.g. metadatas.flags, tags.flags
    let result = []
    for (let eachdata of data) {
      let this_sub_entry = await querySub({entry, data: eachdata, field: name, session})
      let {fieldPrefix, fieldSuffix, newdata} = extractSingleField({
        model: name,
        field,
        data:eachdata,
        sub: true
      })
      let thisresult = await APIs[`${fieldPrefix}API`]({
        operation,
        prefield: prefield+`-${fieldPrefix}`,
        field: fieldSuffix,
        entry: this_sub_entry,
        data: newdata,
        session
      })
      let this_result = {[fieldPrefix]: thisresult, id: this_sub_entry.id}
      result.push(this_result)
      if (name === 'relations') { // relationsFieldHook
        let {other_model, other_id} = this_sub_entry
        let other_entry = await Models[other_model].find({id: other_id}).session(session) // process this later, so use the global name
        if (other_entry.length !== 1) {
          throw Error(`can not get unique entry for ${other_model} by id:${other_id}`)
        }
        other_entry = other_entry[0]
        let that_sub_entry = other_entry[name].find(_ => _.id === this_sub_entry.id)
        that_sub_entry[fieldSuffix] = this_result[fieldSuffix]
        other_entry.markModified(name)
        await other_entry.save()
      }
    }
    return result
  } else {
    if (operation === '+') { // data should be array
      for (let eachdata of data) {
        let {simple, withs} = extractWiths({data: eachdata, model: name, sub: true})
        simple.id = await getNextSequenceValue(prefield) // not use session
        // fullquery delete the query_key, only have query_key_id
        // query_entry is the entry for the 'Tag'
        // let {query_id, rawquery, fullquery, query_entry} = await queryTaglikeID({field: name, query: simple, getEntry:true})
        let {tag_query_id, raw_tag_query, full_tag_query, tag_query_entry} = await queryTaglikeID({field: name, query: simple, getEntry:true, session, entry_model})
        if (name === 'relations') { // relationsCreateHookBeforeWiths
          let relationInfo = extractRelationInfo({full_tag_query, entry_model, entry_id})
          let {
            other_model, other_id,
            aorb, other_aorb,
            from_id, from_model,
            to_id, to_model,
          } = relationInfo
          if (raw_tag_query.to) raw_tag_query.to_id = to_id
          if (raw_tag_query.from) raw_tag_query.from_id = from_id
          other_entry = await Models[other_model].find({id: other_id}).session(session)
          if (other_entry.length !== 1) {
            throw Error(`can not get unique entry for ${other_model} by id:${other_id}, ${JSON.stringify(full_tag_query,null,2)}, ${JSON.stringify(relationInfo,null,2)}`)
          }
          other_entry = other_entry[0]
          full_tag_query = Object.assign(full_tag_query, {
            from_id, from_model, to_id, to_model,
            other_id,
            other_model,
            aorb,
          })
        }
        let index = entry[name].push(full_tag_query)
        let this_sub_entry = entry[name][index - 1]

        withs = await processWiths({operation, prefield, field: null, entry: this_sub_entry, withs, sub: name, session})
        let thisresult = Object.assign({}, raw_tag_query, withs)
        result.push(thisresult)
        // update reverse
        tag_query_entry.r[entry_model].push(`${entry.id}-${this_sub_entry.id}`)
        await tag_query_entry.save()
        // special taglikes
        if (name === 'relations') { // relationsCreateHookAfterWiths
          let that_sub_entry = Object.assign({}, this_sub_entry._doc)
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
          other_entry[name].push(that_sub_entry)
          await other_entry.save()
          tag_query_entry.r[entry_model].push(`${other_entry.id}-${this_sub_entry.id}`)
          await tag_query_entry.save()
        }

        for (let thishook of hooks) {
          if (thishook.test && !thishook.test({operation, entry, new_sub_entry: this_sub_entry._doc})) continue
          let {add, del} = await thishook({operation, entry, new_sub_entry: this_sub_entry._doc})
          auto_actions.add = auto_actions.add.concat(add)
          auto_actions.del = auto_actions.add.concat(del)
        }
      }
      auto_actions = await processAutoActions(auto_actions)
      return result
    } else if (operation === '*') {
      let this_tag_model = name[0].toUpperCase() + name.slice(1, -1)
      for (let eachdata of data) {
        eachdata = Object.assign({}, eachdata)
        let eachdataraw = Object.assign({}, eachdata)
        // eachdata delete __query__
        let this_sub_entry = await querySub({entry, data: eachdata, field: name, session})
        let old_sub_entry = Object.assign({}, this_sub_entry._doc)
        let {simple, withs} = extractWiths({data:eachdata, model: name, sub: true})
        // fullquery delete the query_key, only have query_key_id
        let {tag_query_id, raw_tag_query, full_tag_query, tag_query_entry} = await queryTaglikeID({field: name, query: simple, test:true, getEntry: true, session, entry_model})

        let relationChangeOtherFlag = false
        let oldTag, newTag
        if (name === 'relations') { // relationsModifyHookBeforeWiths
          let old_sub_relation = extractRelationInfo({full_tag_query: this_sub_entry, entry_model, entry_id})
          let new_sub_relation = extractRelationInfo({full_tag_query, entry_model, entry_id, old:this_sub_entry})
          let old_other_entry

          if (raw_tag_query.to) raw_tag_query.to_id = new_sub_relation.to_id
          if (raw_tag_query.from) raw_tag_query.from_id = new_sub_relation.from_id

          other_entry = await Models[new_sub_relation.other_model].find({id: new_sub_relation.other_id}).session(session) // process this later, so use the global name
          if (other_entry.length !== 1) {
            throw Error(`can not get unique entry for ${other_model} by id:${other_id}`)
          }
          other_entry = other_entry[0]
          // delete old sub_relations in old other_entry
          if (old_sub_relation.other_id !== new_sub_relation.other_id || old_sub_relation.other_model !== new_sub_relation.other_model) {
            old_other_entry = await Models[old_sub_relation.other_model].find({id: old_sub_relation.other_id}).session(session) // delete this
            if (old_other_entry.length !== 1) {
              throw Error(`can not get unique entry for ${old_sub_relation.other_model} by id:${old_sub_relation.other_id}`)
            }
            old_other_entry = old_other_entry[0]
            old_other_entry[name] = old_other_entry[name].filter(_ => _.id !== this_sub_entry.id)
            old_other_entry.markModified(name)
            await old_other_entry.save()

            let old_code = `${old_other_entry.id}-${this_sub_entry.id}`
            let new_code = `${other_entry.id}-${this_sub_entry.id}`
            let r = await Models[this_tag_model].find({id: this_sub_entry[query_key]}).session(session)
            if (r.length !== 1) throw Error(`not single result when query ${{id: this_sub_entry[query_key]}} in ${this_tag_model}`)
            oldTag = r[0]
            oldTag.r[entry_model] = oldTag.r[entry_model].filter(_ => _ !== old_code)
            oldTag.r[entry_model].push(new_code)
            await oldTag.save()

            relationChangeOtherFlag = true
          }
          full_tag_query = Object.assign(full_tag_query, new_sub_relation)
        }

        // change tag from one to another, modify r for two Tag
        // update reverse, must put here
        if ((tag_query_entry && (this_sub_entry[query_key] !== tag_query_entry.id))) {
          // console.log('eachdata:', eachdata, 'tag_query_entry:', tag_query_entry, 'this_sub_entry:', this_sub_entry, 'simple:', simple)
          if (!oldTag) {
            let r = await Models[this_tag_model].find({id: this_sub_entry[query_key]}).session(session)
            if (r.length !== 1) throw Error(`not single result when query ${{id: this_sub_entry[query_key]}} in ${this_tag_model}`)
            oldTag = r[0]
          }
          newTag = tag_query_entry
          let code = `${entry.id}-${this_sub_entry.id}`
          oldTag.r[entry_model] = oldTag.r[entry_model].filter(_ => _ !== code)
          newTag.r[entry_model].push(code)
          await oldTag.save()
          await newTag.save()
          if (name === 'relations') {
            let other_code = `${other_entry.id}-${this_sub_entry.id}`
            oldTag.r[entry_model] = oldTag.r[entry_model].filter(_ => _ !== other_code)
            newTag.r[entry_model].push(other_code)
            await oldTag.save()
            await newTag.save()
          }
        }

        simple = full_tag_query
        this_sub_entry.set(simple)
        simple.id = this_sub_entry.id
        raw_tag_query.id = simple.id
        simple[query_key] = this_sub_entry[query_key]
        withs = await processWiths({operation, prefield, field: null, entry: this_sub_entry, withs, sub: name, session})
        let thisresult = Object.assign({}, raw_tag_query, withs)
        result.push(thisresult)

        if (name === 'relations') { // relationsModifyHookAfterWiths
          let that_sub_entry = Object.assign({}, this_sub_entry._doc)
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
          if (relationChangeOtherFlag) { // just push it
            other_entry[name].push(that_sub_entry)
          } else { // search and replace it
            let findit = other_entry[name].find(_ => _.id === that_sub_entry.id)
            Object.assign(findit, that_sub_entry)
          }
          other_entry.markModified(name)
          await other_entry.save()
        }

        for (let thishook of hooks) {
          if (thishook.test && !thishook.test({operation, entry, old_sub_entry, new_sub_entry: this_sub_entry._doc})) continue
          let {add, del} = await thishook({operation, entry, old_sub_entry, new_sub_entry: this_sub_entry._doc})
          auto_actions.add = auto_actions.add.concat(add)
          auto_actions.del = auto_actions.add.concat(del)
        }
      }
      auto_actions = await processAutoActions(auto_actions)
      return result
    } else if (operation === '-') {
      let this_tag_model = name[0].toUpperCase() + name.slice(1, -1)
      let entries = []
      if (data) {
        for (let eachdata of data) {
          let this_sub_entry = await querySub({entry, data: eachdata, field: name, session})
          entries.push(this_sub_entry)
        }
      } else {
        entries = entry[name].map(_ => _)
      }
      for (let this_sub_entry of entries) {
        let old_sub_entry = Object.assign({}, this_sub_entry._doc)
        let {simple, withs} = extractWiths({data: this_sub_entry._doc, model: name, sub: true})
        //simple = {}
        withs = {}
        withs = await processWiths({operation, prefield, field: null, entry: this_sub_entry, withs, sub: name, session})

        simple.id = this_sub_entry.id
        simple[query_key] = this_sub_entry[query_key]
        this_sub_entry.remove()
        let thisresult = Object.assign({}, simple, withs)
        result.push(thisresult)

        let r = await Models[this_tag_model].find({id: this_sub_entry[query_key]}).session(session)
        if (r.length !== 1) throw Error(`not single result when query ${{id: this_sub_entry[query_key]}} in ${this_tag_model}`)
        let taglike = r[0]
        let code = `${entry.id}-${this_sub_entry.id}`
        taglike.r[entry_model] = taglike.r[entry_model].filter(_ => _ !== code)
        await taglike.save()

        if (name === 'relations') { // relationsDeleteHook
          let {other_model, other_id} = this_sub_entry
          let other_entry = await Models[other_model].find({id: other_id}).session(session) // process this later, so use the global name
          if (other_entry.length !== 1) {
            throw Error(`can not get unique entry for ${other_model} by id:${other_id}`)
          }
          other_entry = other_entry[0]
          other_entry[name] = other_entry[name].filter(_ => _.id !== this_sub_entry.id)
          other_entry.markModified(name)
          await other_entry.save()
          let code = `${other_entry.id}-${this_sub_entry.id}`
          taglike.r[entry_model] = taglike.r[entry_model].filter(_ => _ !== code)
          await taglike.save()
        }
        for (let thishook of hooks) {
          if (thishook.test && !thishook.test({operation, entry, old_sub_entry})) continue
          let {add, del} = await thishook({operation, entry, old_sub_entry})
          auto_actions.add = auto_actions.add.concat(add)
          auto_actions.del = auto_actions.add.concat(del)
        }
      }
      auto_actions = await processAutoActions(auto_actions)
      return result
    } else if (operation === 'o') {
      let newIDs = data.map(_ => _.id).sort()
      let oldIDs = Array.from(entry[name]).map(_ => _.id).sort()
      if (JSON.stringify(newIDs) !== JSON.stringify(oldIDs)) {
        throw Error(`${name} reorder error: not the same IDs, ${oldIDs} v.s. ${newIDs}`)
      }
      newIDs = data.map(_ => _.id) // no sort here
      let fullResult = entry[name].map(_ => _)
      // console.log('before reorder:', JSON.stringify(fullResult, null, 2))
      // console.log('data:', data)
      newIDs.forEach((value, index) => {
        let thisresult = fullResult.find(_ => _.id === value)
        entry[name][index] = thisresult
      })
      // console.log('after reorder:', JSON.stringify(Array.from(entry[name]).map(_ => _.id), null, 2))
      entry.markModified(name)
      return newIDs
    }
  }
}
async function metadatasAPI ({operation, prefield, field, data, entry, session, origin}) {
  // field could be flags, that's to `operate` flags instead of metadata
  const name = "metadatas"
  return await taglikeAPI({name, operation, prefield, field, data, entry, session})
}

function extractRelationInfo ({full_tag_query, entry_model, entry_id, old}) {
  let other_model, other_id
  let aorb, other_aorb
  let {from_id, from_model, to_id, to_model} = full_tag_query
  if (!from_id && !to_id) {
    if (old) {
      return _.pick(old, ['other_model', 'other_id', 'aorb', 'other_aorb', 'from_id', 'from_model', 'to_id', 'to_model'])
    } else {
      throw Error('no from-to info')
    }
  }
  if (!from_model) from_model = entry_model
  if (!to_model) to_model = entry_model
  if (!from_id) from_id = entry_id
  if (!to_id) to_id = entry_id
  if (from_id && from_model && to_id && to_model) {
    if (from_id === to_id && from_model === to_model) {
      throw Error('Can not have a self-relation')
    }
    if (entry_id === from_id && entry_model === from_model) {
      other_id = to_id
      other_model = to_model
      aorb = 'a'
      other_aorb = 'b'
    } else if (entry_id === to_id && entry_model === to_model) {
      other_id = from_id
      other_model = from_model
      aorb = 'b'
      other_aorb = 'a'
    } else {
      throw Error(`if given {from_id, from_model, to_id, to_model}, at least one pair should be the same as {entry_id, entry_model}, current is ${ {from_id, from_model, to_id, to_model} } v.s. ${ {entry_id, entry_model} }, origin data: ${full_tag_query}`)
    }
  } else if (from_id && from_model) {
      other_id = from_id
      other_model = from_model
      to_id = entry_id
      to_model = entry_model
      aorb = 'b'
      other_aorb = 'a'
  } else if (to_id && to_model) {
      other_id = to_id
      other_model = to_model
      from_id = entry_id
      from_model = entry_model
      aorb = 'a'
      other_aorb = 'b'
  } else {
    throw Error(`should have {from_id, from_model} or {to_id, to_model}`)
  }
  return {other_model, other_id, aorb, other_aorb, from_id, from_model, to_id, to_model}
}
async function relationsAPI ({operation, prefield, field, data, entry, session, origin}) {
  // field could be flags, that's to `operate` flags instead of metadata
  const name = "relations"
  return await taglikeAPI({ name, operation, prefield, field, data, entry, session})
}

async function cataloguesAPI ({operation, prefield, field, data, entry, session, origin}) {
  const name = "catalogues"
  return await taglikeAPI({name, operation, prefield, field, data, entry, session})
}
async function tagsAPI ({operation, prefield, field, data, entry, session, origin}) {
  const name = "tags"
  return await taglikeAPI({name, operation, prefield, field, data, entry, session})
}
let APIs = {
  flagsAPI,
  metadatasAPI,
  tagsAPI,
  cataloguesAPI,
  relationsAPI,
  fathersAPI,
  childrenAPI,
  rAPI,
}

// manage functions
function getRequire (Model) {
  let tree = Model.schema.tree
  let fields = Object.keys(tree)
  let good = fields.filter(_ => tree[_].required)
  return good
}
async function bulkAdd({model, data, session, meta, origin}) {
  if (!session) session = await mongoose.startSession()
  if (!meta) meta = {bulk: true}
  try {
    session.startTransaction()
    console.log("start to add")
    let result = []
    let workingDatas = []
    for (let eachdata of data) {
      let {simple, withs} = extractWiths({ data: eachdata, model})
      let workingData = {simple, withs}
      let r = await apiSessionWrapper({
        operation: '+',
        data: simple,
        model,
        session,
        meta,
      })
      let id = r.modelID
      eachdata.id = id
      workingData.id = id
      workingDatas.push(workingData)
    }
    for (let eachdata of workingDatas) {
      let {withs,id} = eachdata
      let r = await apiSessionWrapper({
        operation: '*',
        data: withs,
        model,
        query:{id},
        session,
        meta,
      })
      result.push(r.result)
    }
    let history = new globals.Models.History({
      operation:'++', data, meta,
    }); history.$session(session); await history.save();

    console.log("before commit")
    await session.commitTransaction()
    return result
  } catch (error) {
    await session.abortTransaction()
    throw error
  }
}

// export
export default {api, initModels, getRequire, bulkAdd}
