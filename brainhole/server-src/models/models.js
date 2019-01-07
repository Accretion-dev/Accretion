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
formatMap.set(Schema.Types.ObjectId, 'id')

let top = [
  'Article',
  'Website',
  'File',
  'Book',
  'Snippet',
  'Info',
]

let others = [
  'Config',
  'UserConfig',
]

let WithTag = [...top]
let WithCatalogue = [...top]
let WithRelation = [...top, 'Tag']
// tag-like models have displayName, discription fields
let TagLike = ['Tag', 'Catalogue', 'MetaData', 'Relation']

let WithFather = [...top, 'Tag', 'Catalogue']
let WithChild = [...top, 'Tag', 'Catalogue']
let WithMetadata = [...WithFather] // and all nested fields

let All = [...WithMetadata, 'Metadata', 'Relation']

let WithFlag = [...All] // and all nested fields

let WithInfo = {
  WithTag,
  WithCatalogue,
  WithRelation,
  WithFather,
  WithChild,
  WithMetadata,
  WithFlag,
}
// generate list to tell the withs of each model
let Withs = {}
All.forEach(key => Withs[key] = [])
Object.keys(WithInfo).forEach(key => {
  let fieldName = key.slice(4).toLowerCase()
  if (fieldName === 'child') {
    fieldName = fieldName + 'ren'
  } else {
    fieldName = fieldName + 's'
  }
  WithInfo[key].forEach(eachmodel => {
    Withs[eachmodel].push(fieldName)
  })
})

let methods, schemaData
let foreignSchemas = { }

/* operation type:
1. aggregate, findOne
2. create, modify, delete
*/
function findNewIDs (data, entry) {
  let result = {}
  if (entry._id && !data._id) {
    result._id = entry._id
  }
  let keys = Object.keys(data)
  keys.forEach(key => {
    let field = entry[key]
    if (Array.isArray(field)) {
      result[key] = field.map((item, index) => findNewIDs(data[key][index], item))
    }
  })
  return result
}
async function processWiths ({ operation, withs, entry, field }) {
  let keys = Object.keys(withs)
  let result = {}
  for (let key of keys) {
    let api = `${key}API`
    result[key] = await entry.schema[api]({ operation, data: withs[key], entry, field })
  }
}
function extractWiths ({ data, schema }) {
  let withs = new Set(schema.__withs__)
  let keys = new Set(Object.keys(data))
  let result = {
    simple: {},
    withs: {},
  }
  keys.forEach(key => {
    if (withs.includes(key)) {
      result.withs[key] = data[key]
    } else {
      result.simple[key] = data[key]
    }
  })
  return result
}
async function api ({ operation, data, field, model, id }) {
  let rawdata = Object.assign({}, data)
  let Model = mongoose.models[model]
  let schema = Model.schema
  if (!Model) throw Error(`unknown model ${model}`)
  if (operation === 'aggregate' || operation === 'findOne') {
    let result = await Model.aggregate(data)
    // result is query aggregate result
    return {operation, data, field, model, result}
  } else if (operation === 'create') {
    if (!field) { // e.g, create new Article, with some initial Tag, Cataloge...
      let {simple, withs} = extractWiths({data, schema})
      let entry = new Model(simple)
      await entry.save()
      await processWiths({operation, withs, entry, model, field})
      let ids = findNewIDs(data, entry)
      await entry.save()
      // result is new _ids for document and subdocument
      return {operation, data, field, model, result: ids}
    } else { // e.g. add new tag, add new catalogues
      let entry = await Model.findById(id)
      if (!entry) throw Error(`no entry with ${id} found in model ${model}`)
      let Field = entry[field]
      if (!Field) throw Error(`no field ${field} found in model ${model}`)
      let data = data[field]
      if (!data) throw Error(`should provide data.${field}`)
      let subentry = Field.id(data._id)
      if (!subentry) throw Error(`subdocument ${field} with id ${data._id} not exists!`)
      if (!entry.schema[`${field}API`]) throw Error(`Do not have api for ${field}`)
      let result = await entry.schema[`${field}API`]({operation, data, entry: subentry, model, field})
      entry.history.push({
        operation,
        field,
        result,
      })
      await entry.save()
      // result is _id of the new subdocument
      return {operation, data, field, model, result: {_id: result._id}}
    }
  } else if (operation === 'modify') { // modeify top models (simple fields and nested fields)
    if (!field) {
      let entry = await Model.findById(id)
      if (!entry) throw Error(`no entry with ${id} found in model ${model}`)
      let {simple, withs} = extractWiths({data, shcema})
      entry.set(simple)
      await processWiths({operation, withs, entry, model, field})
      entry.history.push({
        operation,
        field,
        result: data
      })
      // e.g. modify a tag should tell all models that have this tag
      // do not wait for this action, will send a error message later if meet error
      await entry.save()
      // return is the input data, frontend should update these fields as saved
      return {operation, data, field, model, result: data}
    } else {
      let entry = await Model.findById(id)
      if (!entry) throw Error(`no entry with ${id} found in model ${model}`)
      let Field = entry[field]
      if (!Field) throw Error(`no field ${field} found in model ${model}`)
      let data = data[field]
      if (!data) throw Error(`should provide data.${field}`)
      let subentry = Field.id(data._id)
      if (!subentry) throw Error(`subdocument ${field} with id ${data._id} not exists!`)
      if (!entry.schema[`${field}API`]) throw Error(`Do not have api for ${field}`)
      let result = await entry.schema[`${field}API`]({operation, data, entry: subentry, model, field})
      entry.history.push({
        operation,
        field,
        result: data,
      })
      entry.save()
      // result is the input data, frontend should update these fields as saved
      return {operation, data, field, model, result}
    }
  } else if (operation === 'delete') {
    if (!field) {
      let entry = await Model.findById(id)
      if (!entry) throw Error(`no entry with ${id} found in model ${model}`)
      // TODO: remove all reverse and nested reverse hook
      await entry.remove()
      return {operation, data, field, model, result: id}
    } else {
      let entry = await Model.findById(id)
      if (!entry) throw Error(`no entry with ${id} found in model ${model}`)
      let Field = entry[field]
      if (!Field) throw Error(`no field ${field} found in model ${model}`)
      let data = data[field]
      if (!data) throw Error(`should provide data.${field}`)
      let subentry = Field.id(data._id)
      if (!subentry) throw Error(`subdocument ${field} with id ${data._id} not exists!`)
      if (!entry.schema[`${field}API`]) throw Error(`Do not have api for ${field}`)
      let result = await entry.schema[`${field}API`]({operation, data, entry: subentry, model, field})
      entry.history.push({
        operation,
        field,
        result: data,
      })
      entry.save()
      // result is the input data, frontend should update these fields as saved
      return {operation, data, field, model, result}
    }
  }
}

async function flagsAPI ({operation, data, entry}) {
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
      let metadataObj = await mongoose.models.Metadata.findById(metadata._id)
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
4. add history for AllSimple
5. add createdAt, modifiedAt, comment for all schema
6. add __reverse__ for Tag, Catalogue, Metadata and Relation
7. generate schema
*/

// 1. generate nested schemas (only with simple field)
Object.keys(models).forEach(key => {
  let Model = models[key]
  let nestedKeys
  if (Model.nestedKeys === 'all') {
    nestedKeys = Object.keys(Model.schema)
  } else {
    nestedKeys = Model.nestedKeys
  }
  let schema = _.pick(Model.schema, nestedKeys)
  schema._id = { type: Schema.Types.ObjectId, default: null },
  schema.flags = { type: Schema.Types.Mixed },
  foreignSchemas[key] = schema
})
// 2. add subdocuments
let subSchema = {} // TagThrough, RelationThrough
// tags, catalogues, relations
let todos = ['Tag', 'Catalogue']
let subWiths = {
  Tag: ['relations', 'metadatas', 'flags'],
  Catalogue: ['metadatas', 'flags'],
  Relation: ['metadatas', 'flags'],
  Metadata: ['flags'],
}
todos.forEach(Type => {
  let type = Type.toLowerCase()
  let withName = `With${Type}`
  schemaData = {
    [type]: foreignSchemas[Type],
  }
  subSchema[type] = new Schema(schemaData)
  subSchema[type].__withs__ = subWiths[type]
  WithInfo[withName].forEach(key => {
    let Model = models[key]
    let schemaDict = Model.schema
    schemaDict[`${type}s`] = [subSchema[type]]
  })
})
// relations (tops and Tag)
schemaData = {
  relation: foreignSchemas.Relation,
  value: { type: Schema.Types.Mixed },
  direction: { type: String },
  fromModel: { type: String },
  toModel: { type: String },
  from: { type: Schema.Types.Mixed },
  to: { type: Schema.Types.Mixed },
}
subSchema.relation = new Schema(schemaData)
WithRelation.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.relations = [subSchema.relation]
})
// family
WithFather.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.fathers = [foreignSchemas[key]]
})
WithChild.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.children = [foreignSchemas[key]]
})
// metadatas (for WithMetadata and subSchema)
schemaData = {
  metadata: foreignSchemas.Metadata,
  value: { type: Schema.Types.Mixed },
}
subSchema.metadata = new Schema(schemaData)
WithMetadata.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.metadatas = [subSchema.metadata]
})
Object.keys(subSchema).forEach(key => { // all subSchema have metadata
  if (key === 'metadata') return
  let Model = subSchema[key]
  Model.add({ metadatas: [schemaData] })
})
// flags (for WithFlags and subSchema)
WithFlag.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.flags = { type: Schema.Types.Mixed }
})
Object.keys(subSchema).forEach(key => { // all subSchema have flags
  let Model = subSchema[key]
  Model.add({flags:{ type: Schema.Types.Mixed }})
})
// 3. user
All.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.user = foreignSchemas.User
})
// 4. history
schemaData = {
  time: { type: Date, default: Date.now },
  operation: { type: String, index: true },
  field: { type: String, index: true },
  result: { type: Schema.Types.Mixed }
}
All.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  schemaDict.history = [schemaData]
})
// 5. comment, createdAt, modifiedAt, _id for All and subSchema
const extras = {
  _id: { type: Schema.Types.ObjectId, auto: true },
  comment: { type: String, index: true },
  createdAt: { type: Date, default: Date.now },
  modifiedAt: { type: Date, default: Date.now },
}
All.forEach(key => {
  let Model = models[key]
  Object.assign(Model.schema, extras)
})
Object.keys(subSchema).forEach(key => {
  let Model = subSchema[key]
  Model.add(extras)
})
// 6. add reverse (r) for
//    Tag, Catalogue, Metadata and Relation
//    subSchema
todos = ['Tag', 'Catalogue', 'Relation', 'Metadata']
todos.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  let reverseModels = WithInfo[`With${key}`]
  let reverseDict = { }
  reverseModels.forEach(key => {
    reverseDict[key] = [foreignSchemas[key]]
  })
  schemaDict.r = reverseDict
})
top.forEach(key => { // subSchema of tops
  let __ = ['Tag', 'Catalogue', 'Relation']
  __.forEach(subkey => {
    let path = `${key}__${subkey.toLowerCase()}s`
    models.Metadata.schema.r[path] = [{ _id: { type: Schema.Types.ObjectId }}]
  })
})
models.Metadata.schema.r['Tag__relations'] = [{ _id: { type: Schema.Types.ObjectId }}] // special for Tag.relations
// 6. generate schemas
let Schemas = { }
let outputNames = [...All, 'User']
outputNames.forEach(key => {
  let Model = models[key]
  let schemaDict = Model.schema
  Schemas[key] = new Schema(schemaDict)
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
console.log(Withs)
console.log(subSchema)
console.log(structTree)
console.log(Schemas)

// generate models
let Models = {}
outputNames.forEach(key => {
  Models[key] = mongoose.model(key, Schemas[key])
})

export default Models
