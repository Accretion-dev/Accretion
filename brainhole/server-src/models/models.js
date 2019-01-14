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
1. aggregate, findOne
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
async function processWiths ({ operation, withs, entry, model }) {
  let keys = Object.keys(withs)
  let result = {todo: {model, id:entry.id, operation}}
  for (let key of keys) {
    let api = `${key}API`
    result[key] = await APIs[api]({ operation, data: withs[key], entry, key})
  }
  return result
}

/*
  seperate data into 'simple' ones and 'with' ones
*/
function extractWiths ({ data, schema }) {
  let withs = new Set(schema.__withs__)
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
async function api ({ operation, data, field, model, query, meta }) {
  let Model = mongoose.models[model]
  let schema = Model.schema
  if (!Model) throw Error(`unknown model ${model}`)
  if (operation === 'aggregate' || operation === 'findOne') {
    let result = await Model.aggregate(data)
    // result is query aggregate result
    return {operation, data, field, model, result, query, meta}
  } else if (operation === 'create') {
    if (!field) { // e.g, create new Article, with some initial Tag, Cataloge...
      let {simple, withs} = extractWiths({data, schema})
      simple.id = await getNextSequenceValue(model)
      let entry = new Model(simple)
      withs = await processWiths({operation, withs, entry, model})
      simple = await entry.save()
      let result = {withs, simple}
      // add transaction here
      let history = new Models.History({
        operation, field, model, query, result, meta, data
      }); await history.save()
      return {operation, data, field, model, result, query, meta}
    } else { // e.g. add new tag, add new catalogues
      let entry = await Model.find(query)
      if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
      entry = entry[0]
      let Field = structTree[model][field]
      if (!Field) throw Error(`no field ${field} found in model ${model}`)
      if (!Model.schema.__withs__.includes(field)) throw Error(`field ${field} is a simple field, use modify instead`)
      data = data[field]
      if (!data) throw Error(`should provide data.${field}`)
      if (!APIs[`${field}API`]) throw Error(`Do not have api for ${field}`)
      let __ = await APIs[`${field}API`]({operation, data, entry, model, field})
      let simple = await entry.save()
      let result = {field: __, simple}
      // add transaction here
      let history = new Models.History({
        operation, field, model, query, result, meta, data
      }); await history.save()
      return {operation, data, field, model, result, query, meta}
    }
  } else if (operation === 'modify') { // modify top models (simple fields and nested fields)
    let entry = await Model.find(query)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
    entry = entry[0]
    if (!field) {
      // most api call from frontend will just modify simple filed (no withs)
      // api call from backend can modify both simple and withs fields
      let {simple, withs} = extractWiths({data, schema})
      entry.set(simple)
      // TODO: hooks here
      // e.g. modify a tag should tell all models that have this tag
      // do not wait for this action, will send a error message later if meet error
      withs = await processWiths({operation, withs, entry, model})
      simple = await entry.save()
      let result = {withs, simple}
      // add transaction here
      let history = new Models.History({
        operation, field, model, query, result, meta, data
      }); await history.save()
      return {operation, data, field, model, result, query, meta}
    } else {
      let Field = structTree[model][field]
      if (!Field) throw Error(`no field ${field} found in model ${model}`)
      data = data[field]
      if (!data) throw Error(`should provide data.${field}`)
      // move into api functions
      // let subentry = Field.id(data._id)
      // if (!subentry) throw Error(`subdocument ${field} with id ${data._id} not exists!`)
      if (!APIs[`${field}API`]) throw Error(`Do not have api for ${field}`)
      let __ = await APIs[`${field}API`]({operation, data, entry, model, field})
      let simple = await entry.save()
      let result = {simple, field: __}
      // add transaction here
      let history = new Models.History({
        operation, field, model, query, result, meta, data
      }); await history.save()
      return {operation, data, field, model, result, query, meta}
    }
  } else if (operation === 'delete') {
    let entry = await Model.find(query)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
    entry = entry[0]
    if (!field) {
      // TODO: remove all reverse and nested reverse hook, modify result
      let withs = {}
      if (Model.__withs__) {
        for (let thiswith of Model.__withs__) {
          withs[thiswith] = null
        }
      }
      withs = await processWiths({operation, withs, entry, model})
      let simple = await entry.remove()
      let result = {withs, simple}
      // add transaction here
      let history = new Models.History({
        operation, field, model, query, result, meta, data
      }); await history.save()
      return {operation, data, field, model, result, query, meta}
    } else {
      let Field = structTree[model][field]
      if (!Field) throw Error(`no field ${field} found in model ${model}`)
      data = data[field]
      if (!data) throw Error(`should provide data.${field}`)
      if (!APIs[`${field}API`]) throw Error(`Do not have api for ${field}`)
      let __ = await APIs[`${field}API`]({operation, data, entry, model, field})
      let simple = await entry.save()
      let result = {simple, field:__}
      // add transaction here
      let history = new Models.History({
        operation, field, model, query, result, meta, data
      }); await history.save()
      return {operation, data, field, model, result, meta, query}
    }
  }
}

/*
  return result
  have hooks
*/
async function flagsAPI ({operation, data, entry, field}) {
  // simple, just modify flags, no revert back
  // remember to make modified flag for the Mixed field
  if (operation === 'create') {
    entry.flags = data
    entry.markModified('flags')
  } else if (operation === 'modify') {
    entry.flags = Object.assign(entry.flags, data)
    entry.markModified('flags')
  } else if (operation === 'delete') {
    let keys = Object.keys(data)
    for (let key of keys) {
      delete entry.flags[key]
    }
    entry.markModified('flags')
  }
}
async function metadatasAPI ({operation, data, entry, field}) {
  if (operation === 'create') { // data should be array
    for (let eachdata of data) {
      let metadata = data.metadata
      let metadataObj = await mongoose.models.Metadata.findById(metadata.id)
      if (!metadataObj) throw Error(`No metadata with id:${metadata.id} exists!`)
    }
  } else if (operation === 'modify') {
  } else if (operation === 'delete') {
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
  subSchema[type].__withs__ = subWiths[type]
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
subSchema.relation.__withs__ = subWiths["Relation"]
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
  Schemas[key].__withs__ = Withs[key]
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

export default {Models, api, WithsDict, All}
