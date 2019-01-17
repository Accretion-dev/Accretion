import mongoose from 'mongoose'
import models from './default'
import _ from 'lodash'
import passportLocalMongoose from 'passport-local-mongoose'
let Schema = mongoose.Schema

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

let top = [
  'Article',
  'Website',
  'File',
  'Book',
  'Snippet',
  'Info',
]

let others = [
  'History',
  'Config',
  'UserConfig',
  'IDs',
]

let WithTag = [...top]
let WithCatalogue = [...top]
let WithRelation = [...top, 'Tag']
// tag-like models have displayName, discription fields
let TagLike = ['Tag', 'Catalogue', 'MetaData', 'Relation']

let WithFather = [...top, 'Tag', 'Catalogue']
let WithChild = [...top, 'Tag', 'Catalogue']
let WithMetadata = [...WithFather] // and all nested fields

let modelAll = [...WithMetadata, 'Metadata', 'Relation']

let WithFlag = [...modelAll] // and all nested fields

let All = [...modelAll, ...others]
let AllWithUser = [...modelAll, 'UserConfig']
let AllWithTimeComment = [...modelAll]

let WithsDict = {
  WithTag,
  WithCatalogue,
  WithRelation,
  WithFather,
  WithChild,
  WithMetadata,
  WithFlag,
}

let modelTypes = {
    tops: top,
    article: ['Article', 'Info', 'Book'],
    website: ['Website'],
    file: ['File'],
    cross: top,
    tag: ['Tag'],
}

// Extro fields of each fields
// e.g. {'Article': ["tags", "catalogues"...]...}
let Withs = {}
All.forEach(key => Withs[key] = [])
Object.keys(WithsDict).forEach(key => {
  let fieldName = key.slice(4).toLowerCase()
  if (fieldName === 'child') {
    fieldName = fieldName + 'ren'
  } else {
    fieldName = fieldName + 's'
  }
  WithsDict[key].forEach(eachmodel => {
    Withs[eachmodel].push(fieldName)
  })
})

let methods, schemaData


/* operation type:
2. create, modify, delete
*/

// _id of new top model and its submodel
async function getNextSequenceValue(name) {
  let doc = await mongoose.connection.db.collection('IDs').findOneAndUpdate(
    {name},
    {$inc: {count: 1}}
  )
  return doc.value.count;
}
/*
  seperate data into 'simple' ones and 'with' ones
*/
/* Api entry function
    operation: create, delete and modify, aggregate, findOne
    * agregate and findOne:
      just search and return result
    * create
      * with field: (e.g. tags, catalogues)
        only create new submodels (e.g. add tags, add catalogues)
      * without field:
        create new top models with its submodels
    * modify
      * with field:
        modify subfields with specific _id
      * without field:
        modify top models
*/
// TODO: add history and transaction
/* different behavior with different combine of operation, data and query
  operation can be
    * '+': add or create
    * '-': delete
    * '*': modify
  if operation is '+'
    if !field:
      create new document
        processWiths
    else:
      add new 'tag' in field
        if (field.indexOf('.')) >= 0
          let [fieldPrefix, ..fieldSuffix]
          data = data[fieldPrefix]
          field = fieldSuffix.join('')
        else
          data = data[field]
          field = ''
        xxxAPI({operation, data, field, entry})
        // in xxxAPI, again test field, if not ''
        // should extract data, split field and call another API
    elif operation is '-':
      if !field:
        processWiths // data change to null for all withsName
        delete this document
      else:
        only delete some 'tag'
        if (field.indexOf('.')) >= 0
          let [fieldPrefix, ..fieldSuffix]
          data = data[fieldPrefix]
          field = fieldSuffix.join('')
        else
          data = data[field]
          field = ''
        xxxAPI({operation, data, field, entry})
        // in xxxAPI, again test field, if not ''
        // should extract data, split field and call another API
    elif operation is '*':
      if !field:
        modify simple keys
        processWiths
          for each xxxAPI, if operations is modified
            if data.id, get subentry with id
            elif data[primarykey]
              get subentry with primarykey
              check duplicate
                duplicate only happend at metadatas
      else:
        if (field.indexOf('.')) >= 0
          let [fieldPrefix, ..fieldSuffix]
          data = data[fieldPrefix]
          field = fieldSuffix.join('')
        else
          data = data[field]
          field = ''
        xxxAPI({operation, data, field})
*/
let SubWiths = {
  'metadatas': ['flags'],
  'tags': ['metadatas', 'flags'],
  'catalogues': ['metadatas', 'flags'],
  'relations': ['metadatas', 'flags'],
}
function extractWiths ({ data, model, sub }) {
  let thisWiths
  if (sub) {
    thisWiths = SubWiths
  } else {
    thisWiths = Withs
  }
  let withs = thisWiths[model]
  if (!withs.length) {
    return {
      simple: data,
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

async function processWiths ({ operation, prefield, field, entry, withs, sub }) {
  let keys = Object.keys(withs)
  let result = {}
  for (let key of keys) {
    if (!withs[key]) continue
    let api = `${key}API`
    result[key] = await APIs[api]({ operation, prefield: prefield+`-${key}`, field, entry, data: withs[key]})
  }
  return result
}

async function querySubID ({field, query, searchKey}) {
  let query_id, rawquery, fullquery
  let query_key = field.slice(0, -1) // tags, catalogues, relations, metadatas
  if (!(query_key in query || query_key+"_id" in query)) throw Error(`should have ${query_key} or ${query_key}_id: ${query}`)
  // search for xx
  if (query_key+"_id" in query) {
    query_id = query[query_key+"_id"]
    rawquery = query
    fullquery = query
  } else if (query_key in query) {
    fullquery = query
    query = query[query_key]
    if ('id' in query) {
      query_id = query['id']
    } else if (searchKey in query) {
      let thisModel = query_key[0].toUpperCase() + query_key.slice(1)
      let r = await Models[thisModel].find({[searchKey]: query[searchKey]})
      if (r.length !== 1) throw Error(`not single result when query ${query_key} with ${query} in ${thisModel}`)
      query_id = r[0].id
    } else {
      throw Error(`should have 'id' or '${searchKey}' in ${query} in ${field}`)
    }
    fullquery[query_key+"_id"] = query_id
    rawquery = Object.assign({}, fullquery)
    delete fullquery[query_key]
  }
  return {query_id, rawquery, fullquery}
}

async function querySub({entry, data, searchKey, field}) {
  let result, rawquery, fullquery
  let query_key = field.slice(0, -1) // tags, catalogues, relations, metadatas
  if ('id' in data) {
    result = entry[field].find(_ => _.id === data.id )
    if (!result)
      throw Error(`id ${data.id} not exists in ${field}`)
    return result
  } else if ('__query__' in data) {
    fullquery = data
    let query = data.__query__
    delete fullquery.__query__

    let {query_id} = await querySubID({field, query, searchKey})
    // search for xxxxs
    result = entry[field].filter(_ => _[query_key+'_id'] === query_id )
    if (result.length !== 1) {
      if (!(result.length)) {
        throw Error(`${searchKey}: ${searchKey} not found in ${field}`)
      } else {
        throw Error(`${searchKey}: ${searchKey} more than one in ${field}`)
      }
    }
    return result[0]
  } else {
    throw Error(`do not have 'id' or '__query__' in ${field}, don't know how to query, entry:${entry}, data:${data}`)
  }
}
function extractField ({model, field, data, sub}) {
  let fieldPrefix, fieldSuffix, newdata
  let thisWiths = sub ? SubWiths : Withs
  if (field.indexOf('.') >= 0)  {
    [fieldPrefix, ...fieldSuffix] = field.split('.')
    fieldSuffix = fieldSuffix.join('.')
  }
  else {
    fieldPrefix = field
    fieldSuffix = ''
  }
  newdata = data[fieldPrefix]
  if (!newdata) throw Error(`should provide data with field: ${field} in model ${model}`)
  if (!thisWiths[model].includes(fieldPrefix)) throw Error(`no field ${field} found in model ${model}`)
  if (!APIs[`${fieldPrefix}API`]) throw Error(`Do not have api for ${field}`)
  return {newdata, fieldPrefix, fieldSuffix}
}

async function apiSingle ({operation, model, field, data, entry, query, meta}) {
  let withs, simple, result

  let {fieldPrefix, fieldSuffix, newdata} = extractField({model, field, data})
  let __ = await APIs[`${fieldPrefix}API`]({operation, prefield: model, field: fieldSuffix, entry, data: newdata})
  withs = {[fieldPrefix]: __}
  simple = await entry.save()
  result = simple
  let modelID = simple.id
  // add transaction here
  let history = new Models.History({
    operation, modelID, model, field, data, query, result, withs, meta
  }); await history.save()
  return {operation, modelID, model, field, data, query, result, withs, meta}
}


async function api ({ operation, data, query, model, meta, field }) {
  let Model = mongoose.models[model]
  if (!Model) throw Error(`unknown model ${model}`)

  if (operation === 'aggregate' || operation === 'findOne') { // search
    let result = await Model.aggregate(data)
    // result is query aggregate result
    return {operation, model, field, data, query, result, meta}
  } else if (operation === '+') {
    if (!field) { // e.g, create new Article, with some initial Tag, Cataloge...
      let {simple, withs} = extractWiths({data, model})
      simple.id = await getNextSequenceValue(model)
      let entry = new Model(simple)
      withs = await processWiths({operation, prefield: model, field, entry, withs})
      let result = await entry.save()
      let modelID = result.id
      // add transaction here
      let history = new Models.History({
        operation, modelID, model, field, data, query, result, withs, meta,
      }); await history.save()
      return {operation, modelID, model, field, data, query, result, withs, meta}
    } else { // e.g. add new tag, add new catalogues
      let entry = await Model.find(query)
      if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
      entry = entry[0]

      let result = await apiSingle({operation, model, field, data, entry, query, meta})
      return result
    }
  } else if (operation === '*') { // modify top models (simple fields and nested fields)
    let entry = await Model.find(query)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
    entry = entry[0]

    if (!field) {
      let {simple, withs} = extractWiths({data, model})
      entry.set(simple)
      withs = await processWiths({operation, prefield: model, field, entry, withs})
      simple = await entry.save()
      let result = simple
      let modelID = result.id
      // add transaction here
      let history = new Models.History({
        operation, modelID, model, field, data, query, result, withs, meta
      }); await history.save()
      return {operation, modelID, model, field, data, query, result, withs, meta}
    } else {
      let result = await apiSingle({operation, model, field, data, entry, query, meta})
      return result
    }
  } else if (operation === '-') {
    let entry = await Model.find(query)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
    entry = entry[0]

    if (!field) {
      let withs = {}
      if (Withs[model]) {
        for (let thiswith of Withs[model]) {
          withs[thiswith] = null
        }
      }
      withs = await processWiths({operation, prefield: model, field, entry, withs})
      let simple = await entry.remove()
      let result = simple
      let modelID = result.id
      // add transaction here
      let history = new Models.History({
        operation, modelID, model, field, data, query, result, withs, meta
      }); await history.save()
      return {operation, modelID, model, field, data, query, result, withs, meta}
    } else {
      let result = await apiSingle({operation, model, field, data, entry, query, meta})
      return result
    }
  } else {
    throw Error(`operation should be one of '+', '-', '*', not ${operation}`)
  }
}

/*
  return result
  have hooks
*/
async function flagsAPI ({operation, prefield, field, entry, data}) {
  // field should always be '' or undefined
  // prefield could be any
  if (field) throw Error('field should always be blank or undefined, debug it!')
  if (operation === '+') {
    entry.flags = data
    return entry.flags
  } else if (operation === '*') {
    if (!entry.flags) {
      entry.flags = data
    } else {
      entry.flags = Object.assign(entry.flags, data)
    }
    entry.markModified('flags')
    return entry.flags
  } else if (operation === '-') {
    let keys = Object.keys(data)
    for (let key of keys) {
      delete entry.flags[key]
    }
    entry.markModified('flags')
    return entry.flags
  }
}
async function metadatasAPI ({operation, prefield, field, data, entry}) {
  // field could be flags, that's to `operate` flags instead of metadata
  const name = "metadatas"
  const searchKey = "name"
  const query_key = name.slice(0,-1)+'_id'
  if (field) {
    let result = []
    for (let eachdata of data) {
      let thisentry = await querySub({entry, data: eachdata, searchKey, field: name})
      let {fieldPrefix, fieldSuffix, newdata} = extractField({
        model: name,
        field,
        data:eachdata,
        sub: true
      })
      let __ = await APIs[`${fieldPrefix}API`]({
        operation,
        prefield: prefield+`-${fieldPrefix}`,
        field: fieldSuffix,
        entry: thisentry,
        data: newdata
      })
      result.push({[fieldPrefix]: __})
    }
    return result
  } else {
    if (operation === '+') { // data should be array
      let result = []
      for (let eachdata of data) {
        let {simple, withs} = extractWiths({data: eachdata, model: name, sub: true})
        simple.id = await getNextSequenceValue(prefield)

        // modify simple in the function
        let {query_id, rawquery, fullquery} = await querySubID({field: name, query: simple, searchKey})
        // fullquery delete the query_key, only have query_key_id
        let index = entry[name].push(fullquery)
        let thisentry = entry[name][index - 1]
        withs = await processWiths({operation, prefield, field: null, entry: thisentry, withs})
        let thisresult = Object.assign({}, rawquery, withs)
        result.push(thisresult)
      }
      return result
    } else if (operation === '*') {
      let result = []
      for (let eachdata of data) {
        let thisentry = await querySub({entry, data: eachdata, searchKey, field: name})
        let {simple, withs} = extractWiths({data:eachdata, model: name, sub: true})
        thisentry.set(simple)
        simple.id = thisentry.id
        simple[query_key] = thisentry[query_key]
        withs = await processWiths({operation, prefield, field: null, entry: thisentry, withs})
        let thisresult = Object.assign({}, simple, withs)
        result.push(thisresult)
      }
      return result
    } else if (operation === '-') {
      let result = []
      for (let eachdata of data) {
        let thisentry = await querySub({entry, data: eachdata, searchKey, field: name})
        let {simple, withs} = extractWiths({data:eachdata, model: name, sub: true})
        withs = await processWiths({operation, prefield, field: null, entry: thisentry, withs})
        simple.id = thisentry.id
        simple[query_key] = thisentry[query_key]
        thisentry.remove()
        let thisresult = Object.assign({}, simple, withs)
        result.push(thisresult)
      }
      return result
    }
  }
}
async function tagsAPI ({operation, data, entry, field}) {
  if (operation === 'create') {
  } else if (operation === 'modify') {
  } else if (operation === 'delete') {
  }
}
async function cataloguesAPI ({operation, data, entry, field}) {
  if (operation === 'create') {
  } else if (operation === 'modify') {
  } else if (operation === 'delete') {
  }
}
// TODO: some special relation: translation
async function relationsAPI ({operation, data, entry, field}) {
  if (operation === 'create') {
  } else if (operation === 'modify') {
  } else if (operation === 'delete') {
  }
}
async function fathersAPI ({operation, data, entry, field}) {
  if (operation === 'create') {
  } else if (operation === 'modify') {
  } else if (operation === 'delete') {
  }
}
async function childrenAPI ({operation, data, entry, field}) {
  if (operation === 'create') {
  } else if (operation === 'modify') {
  } else if (operation === 'delete') {
  }
}
let APIs = {
  flagsAPI,
  metadatasAPI,
  tagsAPI,
  cataloguesAPI,
  relationsAPI,
  fathersAPI,
  childrenAPI,
}
/* onModify and onDelete method
  for top models:
    tell the Tag, Catalogue, Relation, Metadata to update reverse cite
  for Tag, Catalogue, Relation, Metadata:
    tell models with them to update
*/


/* compile all schemas
1. generate nested schemas (only with simple field)
2. add
    tags, catalogues, relations
    family
    metadata
    flags
  for all needed schemas
3. add user field for AllSimple
4. add createdAt, modifiedAt, comment for all schema
5. add reverse field for Tag, Catalogue, Metadata and Relation
6. generate schema
*/

// 1. generate nested schemas (only with simple field), used later
//Object.keys(models).forEach(key => {
//  let Model = models[key]
//  let nestedKeys
//  if (Model.nestedKeys === 'all') {
//    nestedKeys = Object.keys(Model.schema)
//  } else {
//    nestedKeys = Model.nestedKeys
//  }
//  let schema = _.pick(Model.schema, nestedKeys)
//  schema._id = { type: Number, default: null },
//  foreignSchemas[key] = schema
//})
// schemes of model when cited in other model
let foreignSchemas = {
  User: {
    username: { type: String }
  }
}
// 2. add subdocuments (through table in sql database)
let subSchema = {} // first layer cition
let subWiths = { // second layer cition
  Tag: ['metadatas'],
  Catalogue: ['metadatas'],
  Relation: ['metadatas'],
}

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

// relations (tops and Tag)
// relations of the same or the different models
schemaData = {
  relation_id: { type: Number },
  value: { type: Schema.Types.Mixed },
  fromModel: { type: String },
  toModel: { type: String },
  from_id: { type: Number },
  to_id: { type: Number },
}
subSchema.relation = new Schema(schemaData)
WithRelation.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.relations = [subSchema.relation]
})

schemaData = {
  id: { type: Number },
}
subSchema.family = new Schema(schemaData)
// family
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
Object.keys(subSchema).forEach(key => { // all subSchema have metadata
  if (['metadata', 'family'].includes(key)) return
  let Model = subSchema[key]
  Model.add({ metadatas: [subSchema.metadata] })
})

// flags (for WithFlags and subSchema)
WithFlag.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.flags = { type: Schema.Types.Mixed }
})
Object.keys(subSchema).forEach(key => { // all subSchema except fathers and child have flags
  if (['fathers', 'children', 'family'].includes(key)) return
  let Model = subSchema[key]
  Model.add({flags:{ type: Schema.Types.Mixed }})
})
// 3. user
AllWithUser.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.user = foreignSchemas.User
})
// 4. comment, createdAt, modifiedAt, _id for All and subSchema
let extras = {
  id: { type: Number, auto: true },
  comment: { type: String, index: true },
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
  if (['history', 'family'].includes(key)) return // not add for these models
  let Model = subSchema[key]
  Model.add(extras)
})
// 5. add reverse (r) for
//    Tag, Catalogue, Metadata and Relation
//    subSchema
todos = ['Tag', 'Catalogue', 'Relation', 'Metadata']
todos.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  let reverseModels = WithsDict[`With${key}`]
  let reverseDict = { }
  reverseModels.forEach(key => {
    reverseDict[key+'_id'] = [{ id: { type: Number } }]
  })
  schemaDict.r = reverseDict
})
top.forEach(key => { // subSchema of tops
  let __ = ['Tag', 'Catalogue', 'Relation']
  __.forEach(subkey => {
    let path = `${key}__${subkey.toLowerCase()}s_id`
    models.Metadata.schema.r[path] = [{ id: { type: Number }}]
  })
})
// 6. generate schemas
let Schemas = { }
let outputNames = [...All, 'User']
outputNames.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  Schemas[key] = new Schema(schemaDict, {collection: key})
})

// plugin user
Schemas.User.plugin(passportLocalMongoose)

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
let structTree = stringifyStructTree(Schemas)
d.s = Schemas
d.mongoose = mongoose

// generate models
let Models = {}
outputNames.forEach(key => {
  Models[key] = mongoose.model(key, Schemas[key])
})
// init ids

d.Models = Models
if (d.main) {
  console.log('model info:', {Withs, subSchema, structTree, Schemas, foreignSchemas, Models, outputNames, WithsDict})
}

export default {Models, api, WithsDict, All, Withs}
