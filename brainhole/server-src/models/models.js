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
  'Through',
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
async function querySubID ({field, query, test}) {
  let query_id, rawquery, fullquery
  let query_key = field.slice(0, -1) // tags, catalogues, relations, metadatas
  if (!(query_key in query || query_key+"_id" in query)) {
    if (test) {
      return {fullquery: query}
    }
    else {
      throw Error(`should have ${query_key} or ${query_key}_id: ${query}`)
    }
  }
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
    } else {
      let thisModel = query_key[0].toUpperCase() + query_key.slice(1)
      let r = await Models[thisModel].find(query)
      if (r.length !== 1) throw Error(`not single result when query ${query_key} with ${query} in ${thisModel}`)
      query_id = r[0].id
    }
    fullquery[query_key+"_id"] = query_id
    rawquery = Object.assign({}, fullquery)
    delete fullquery[query_key]
  }
  return {query_id, rawquery, fullquery}
}
async function querySub({entry, data, field}) {
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

    let {query_id} = await querySubID({field, query})
    // search for xxxxs
    result = entry[field].filter(_ => _[query_key+'_id'] === query_id )
    if (result.length !== 1) {
      if (!(result.length)) {
        throw Error(`query:${query} not found in ${field}`)
      } else {
        throw Error(`query:${query} more than one in ${field}`)
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
  let through = []
  let other_result = []

  let {fieldPrefix, fieldSuffix, newdata} = extractField({model, field, data})
  let {thisresult, thisthrough, thisother_result} = await APIs[`${fieldPrefix}API`]({operation, prefield: model+`-${fieldPrefix}`, field: fieldSuffix, entry, data: newdata})
  if (thisthrough) { through = [...through, ...thisthrough] }
  if (thisother_result) { other_result = [...other_result, ...thisother_result] }

  withs = {[fieldPrefix]: thisresult}
  simple = await entry.save()
  result = simple
  let modelID = simple.id
  // add transaction here
  let history = new Models.History({
    operation, modelID, model, field, data, query, result, withs, meta, through, other_result
  }); await history.save(); await processThrough(through)
  return {operation, modelID, model, field, data, query, result, withs, meta, through, other_result}
}

async function processThrough (through) {
  through = through.map(_ => Object.assign({}, _))
  for (let t of through) {
    if (t.operation === '+') {
      delete t.operation
      let result = new Models.Through(t)
      await result.save()
    } else if (t.operation === '*') {
      let {model_id_new} = t
      delete t.operation
      delete t.model_id_new
      await Models.Through.findOneAndUpdate(t, {$set: {model_id: model_id_new}})
    } else if (t.operation === '-') {
      delete t.operation
      await Models.Through.findOneAndRemove(t)
    }
  }
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
  let keys
  if (operation === '-') {
    if (sub) {
      keys = SubWiths[sub]
    } else {
      keys = Withs[prefield]
    }
  } else {
    keys = Object.keys(withs)
  }
  let result = {}
  let through = []
  let other_result = []
  for (let key of keys) {
    if (operation === '-') {
      if (!entry[key]) continue
      if (Array.isArray(entry[key]) && !(entry[key].length)) continue
    } else {
      if (!withs[key]) continue
    }
    let api = `${key}API`
    let {thisresult, thisthrough, thisother_result} = await APIs[api]({
      operation,
      prefield: prefield+`-${key}`,
      field,
      entry,
      data: withs[key]
    })
    if (thisthrough) { through = [...through, ...thisthrough] }
    if (thisother_result) { other_result = [...other_result, ...thisother_result] }
    result[key] = thisresult
  }
  return {thisresult: result, thisthrough: through, thisother_result: other_result}
}
async function api ({ operation, data, query, model, meta, field }) {
  let Model = mongoose.models[model]
  if (!Model) throw Error(`unknown model ${model}`)
  let through = []
  let other_result = []

  if (operation === 'aggregate' || operation === 'findOne') { // search
    let result = await Model.aggregate(data)
    // result is query aggregate result
    return {operation, model, field, data, query, result, meta}
  } else if (operation === '+') {
    if (!field) { // e.g, create new Article, with some initial Tag, Cataloge...
      let {simple, withs} = extractWiths({data, model})
      simple.id = await getNextSequenceValue(model)
      let entry = new Model(simple)
      let {thisresult, thisthrough, thisother_result} = await processWiths({operation, prefield: model, field, entry, withs})
      if (thisthrough) { through = [...through, ...thisthrough] }
      if (thisother_result) { other_result = [...other_result, ...thisother_result] }
      withs = thisresult

      let result = await entry.save()
      let modelID = result.id
      // add transaction here
      let history = new Models.History({
        operation, modelID, model, field, data, query, result, withs, meta, through, other_result
      }); await history.save(); await processThrough(through)
      return {operation, modelID, model, field, data, query, result, withs, meta, through, other_result}
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
      let {thisresult, thisthrough, thisother_result} = await processWiths({operation, prefield: model, field, entry, withs})
      if (thisthrough) { through = [...through, ...thisthrough] }
      if (thisother_result) { other_result = [...other_result, ...thisother_result] }
      withs = thisresult

      simple = await entry.save()
      let result = simple
      let modelID = result.id
      // add transaction here
      let history = new Models.History({
        operation, modelID, model, field, data, query, result, withs, meta, through, other_result
      }); await history.save(); await processThrough(through)
      return {operation, modelID, model, field, data, query, result, withs, meta, through, other_result}
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
      let {thisresult, thisthrough, thisother_result} = await processWiths({operation, prefield: model, field, entry, withs})
      if (thisthrough) { through = [...through, ...thisthrough] }
      if (thisother_result) { other_result = [...other_result, ...thisother_result] }
      withs = thisresult

      let simple = await entry.remove()
      let result = simple
      let modelID = result.id
      // add transaction here
      let history = new Models.History({
        operation, modelID, model, field, data, query, result, withs, meta, through, other_result
      }); await history.save(); await processThrough(through)
      return {operation, modelID, model, field, data, query, result, withs, meta, through, other_result}
    } else {
      let result = await apiSingle({operation, model, field, data, entry, query, meta})
      return result
    }
  } else {
    throw Error(`operation should be one of '+', '-', '*', not ${operation}`)
  }
}

async function toNextField({operation, prefield, field, entry, data, name}) {
  let result = []
  let through = []
  let other_result = []
  for (let eachdata of data) {
    let thisentry = await querySub({entry, data: eachdata, field: name})
    let {fieldPrefix, fieldSuffix, newdata} = extractField({
      model: name,
      field,
      data:eachdata,
      sub: true
    })
    let {thisresult, thisthrough, thisother_result} = await APIs[`${fieldPrefix}API`]({
      operation,
      prefield: prefield+`-${fieldPrefix}`,
      field: fieldSuffix,
      entry: thisentry,
      data: newdata
    })
    if (thisthrough) { through = [...through, ...thisthrough] }
    if (thisother_result) { other_result = [...other_result, ...thisother_result] }
    result.push({[fieldPrefix]: thisresult})
  }
  return {thisresult: result, thisthrough: through, thisother_result: other_result}
}

async function flagsAPI ({operation, prefield, field, entry, data}) {
  // field should always be '' or undefined
  // prefield could be any
  if (field) throw Error('field should always be blank or undefined, debug it!')
  if (operation === '+') {
    entry.flags = data
    return {thisresult: entry.flags}
  } else if (operation === '*') {
    if (!entry.flags) {
      entry.flags = data
    } else {
      entry.flags = Object.assign(entry.flags, data)
    }
    entry.markModified('flags')
    return {thisresult: entry.flags}
  } else if (operation === '-') {
    if (data) { // delete given flags
      let keys = Object.keys(data)
      for (let key of keys) {
        delete entry.flags[key]
      }
      entry.markModified('flags')
    } else { // delete all flags
      entry.flags = undefined
    }
    return {thisresult: entry.flags}
  }
}
async function taglikeAPI ({name, operation, prefield, field, data, entry, createHook, modifyHook, deleteHook}) {
  // field could be flags, that's to `operate` flags instead of metadata
  const query_key = name.slice(0,-1)+'_id'
  let tpath = prefield
  let tmodel = name[0].toUpperCase() + name.slice(1,-1)
  let result = []
  let through = []
  let other_result = []

  if (field) {
    return await toNextField({operation, prefield, field, data, entry, name})
  } else {
    if (operation === '+') { // data should be array
      for (let eachdata of data) {
        let {simple, withs} = extractWiths({data: eachdata, model: name, sub: true})
        simple.id = await getNextSequenceValue(prefield)
        // fullquery delete the query_key, only have query_key_id
        let {query_id, rawquery, fullquery} = await querySubID({field: name, query: simple})
        through.push({ operation, path: tpath, path_id: simple.id, model: tmodel, model_id: query_id })
        if (createHook) {
          let {thisfullquery: fullquery, thisthrough, thisother_result} = await createHook({name, prefield, field, data, entry, fullquery, withs})
          if (thisthrough) { through = [...through, ...thisthrough] }
          if (thisother_result) { other_result = [...other_result, ...thisother_result] }
          fullquery = thisfullquery
        }
        let index = entry[name].push(fullquery)
        let thisentry = entry[name][index - 1]
        let {thisresult, thisthrough, thisother_result} = await processWiths({operation, prefield, field: null, entry: thisentry, withs, sub: name})
        if (thisthrough) { through = [...through, ...thisthrough] }
        if (thisother_result) { other_result = [...other_result, ...thisother_result] }

        withs = thisresult
        thisresult = Object.assign({}, rawquery, withs)
        result.push(thisresult)
      }
      return {thisresult: result, thisthrough: through, thisother_result: other_result}
    } else if (operation === '*') {
      for (let eachdata of data) {
        let thisentry = await querySub({entry, data: eachdata, field: name})
        let {simple, withs} = extractWiths({data:eachdata, model: name, sub: true})
        // fullquery delete the query_key, only have query_key_id
        let {query_id, rawquery, fullquery} = await querySubID({field: name, query: simple, test: true})
        if (modifyHook) {
          let {thisfullquery: fullquery, thisthrough, thisother_result} = await modifyHook({name, prefield, field, data, entry, thisentry, fullquery})
          if (thisthrough) { through = [...through, ...thisthrough] }
          if (thisother_result) { other_result = [...other_result, ...thisother_result] }
          fullquery = thisfullquery
        }
        simple = fullquery
        if (simple[query_key] && simple[query_key] !== thisentry[query_key]) {
          through.push({
            operation,
            path: tpath,
            path_id: simple.id,
            model: tmodel,
            model_id: query_id,
            model_id_new: simple[query_key],
          })
        }
        thisentry.set(simple)
        simple.id = thisentry.id
        simple[query_key] = thisentry[query_key]
        let {thisresult, thisthrough, thisother_result} = await processWiths({operation, prefield, field: null, entry: thisentry, withs, sub: name})
        if (thisthrough) { through = [...through, ...thisthrough] }
        if (thisother_result) { other_result = [...other_result, ...thisother_result] }

        withs = thisresult
        thisresult = Object.assign({}, simple, withs)
        result.push(thisresult)
      }
      return {thisresult: result, thisthrough: through, thisother_result: other_result}
    } else if (operation === '-') {
      let entries = []
      if (data) {
        for (let eachdata of data) {
          let thisentry = await querySub({entry, data: eachdata, field: name})
          entries.push(thisentry)
        }
      } else {
        entries = entry[name].map(_ => _)
      }
      for (let thisentry of entries) {
        let simple = {}
        let withs = {}
        let {thisresult, thisthrough, thisother_result} = await processWiths({operation, prefield, field: null, entry: thisentry, withs, sub: name})
        if (thisthrough) { through = [...through, ...thisthrough] }
        if (thisother_result) { other_result = [...other_result, ...thisother_result] }

        withs = thisresult
        simple.id = thisentry.id
        simple[query_key] = thisentry[query_key]
        through.push({
          operation,
          path: tpath,
          path_id: thisentry.id,
          model: tmodel,
          model_id: thisentry[query_key],
        })
        thisentry.remove()
        thisresult = Object.assign({}, simple, withs)
        result.push(thisresult)
      }
      return {thisresult: result, thisthrough: through, thisother_result: other_result}
    }
  }
}
async function metadatasAPI ({operation, prefield, field, data, entry}) {
  // field could be flags, that's to `operate` flags instead of metadata
  const name = "metadatas"
  return await taglikeAPI({name, operation, prefield, field, data, entry})
}
// TODO: some special relation: translation
async function relationsCreateHook({name, prefield, field, data, entry, fullquery, withs}) {
  let entry_model = entry.schema.options.collection
  let entry_id = entry.id
  let other_model, other_id
  let aorb, other_aorb
  let through = []
  let other_result = []

  let {from_id, from_model, to_id, to_model} = fullquery
  if (from_id && from_model && to_id && to_model) {
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
      throw Error(`if given {from_id, from_model, to_id, to_model}, at least one pair should be the same as {entry_id, entry_model}, current is ${ {from_id, from_model, to_id, to_model} } v.s. ${ {entry_id, entry_model} }, origin data: ${data}`)
    }
  } else if (from_id && from_model) {
      other_id = from_id
      other_model = from_model
      to_id = entry_id
      to_model = entry_model
      aorb = 'b'
      other_aorb = 'a'
  } else if (to_id && to_model) {
      other_id = from_id
      other_model = from_model
      to_id = entry_id
      to_model = entry_model
      aorb = 'a'
      other_aorb = 'b'
  } else {
    throw Error(`should have {from_id, from_model} or {to_id, to_model}`)
  }
  let other_fullquery = Object.assign({}, fullquery)
  other_fullquery = Object.assign(other_fullquery, {
    from_id, from_model, to_id, to_model,
    other_id: entry_id,
    other_model: entry_model,
    aorb: other_aorb
  })

  let other_entry = await Models[other_model].find({id: other_id})
  if (other_entry.length !== 1) {
    throw Error(`can not get unique entry for ${other_model} by id:${other_id}`)
  }
  let index = other_entry[name].push(other_fullquery)
  let thisentry = entry[name][index - 1]
  let {thisresult, thisthrough, thisother_result} = await processWiths({operation, prefield, field: null, entry: other_entry, withs, sub: name})
  if (thisthrough) { through = [...through, ...thisthrough] }
  if (thisother_result) { other_result = [...other_result, ...thisother_result] }

  other_result.push(Object.assign({}, other_fullquery, withs))

  fullquery = Object.assign(fullquery, {
    from_id, from_model, to_id, to_model,
    other_id,
    other_model,
    aorb,
  })
  return {fullquery, through, other_result}
}
async function relationsModifyHook({name, prefield, field, data, entry, thisentry, fullquery}) {

  return fullquery
}
async function relationsAPI ({operation, prefield, field, data, entry}) {
  // field could be flags, that's to `operate` flags instead of metadata
  const name = "relations"
  return await taglikeAPI({name, operation, prefield, field, data, entry})
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
5. generate schema
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
// 5. generate schemas
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
d.api = api
if (d.main) {
  console.log('model info:', {Withs, subSchema, structTree, Schemas, foreignSchemas, Models, outputNames, WithsDict})
}

export default {Models, api, WithsDict, All, Withs}
