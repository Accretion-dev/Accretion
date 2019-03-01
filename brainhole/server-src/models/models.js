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
  'Editing',
  'Workspace',
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
  'tags': ['flags'],
  'catalogues': ['flags'],
  'relations': ['flags'],
}
async function queryTaglikeID ({field, query, test, getEntry}) {
  // fullquery delete the query_key, only have query_key_id
  // query for foreignField if do not know id, else just include id
  let query_id, rawquery, fullquery, query_entry
  let query_key = field.slice(0, -1) // tags, catalogues, relations, metadatas
  if (!(query_key in query || query_key+"_id" in query)) {
    // do not change taglike, no need to query for the new one
    if (test) {
      return {full_tag_query: query}
    } else {
      throw Error(`should have ${query_key} or ${query_key}, data:${JSON.stringify(query,null,2)}`)
    }
  }
  let this_tag_model = query_key[0].toUpperCase() + query_key.slice(1)
  // query_id is the id we want
  // raw_query is the input query
  // fullquery is raw_query + {query_id}
  if (query_key+"_id" in query) {
    query_id = query[query_key+"_id"]
    rawquery = query
    fullquery = query
    if (getEntry) {
      let r = await Models[this_tag_model].find({id: query_id})
      if (r.length !== 1) throw Error(`not single result when query ${query_key} with ${{id: query_id}} in ${this_tag_model}`)
      query_entry = r[0]
    }
  } else if (query_key in query) {
    fullquery = query
    query = query[query_key]
    if ('id' in query) {
      query_id = query['id']
      if (getEntry) {
        let r = await Models[this_tag_model].find({id: query_id})
        if (r.length !== 1) throw Error(`not single result when query ${query_key} with ${{id: query_id}} in ${this_tag_model}`)
        query_entry = r[0]
      }
    } else {
      let r = await Models[this_tag_model].find(query)
      if (r.length !== 1) throw Error(`not single result when query ${query_key} with ${JSON.stringify(query)} in ${this_tag_model}\n${JSON.stringify(r)}`)
      query_entry = r[0]
      query_id = query_entry.id
    }
    fullquery[query_key+"_id"] = query_id
    rawquery = Object.assign({}, fullquery)
    delete fullquery[query_key]
  }
  return {tag_query_id: query_id, raw_tag_query: rawquery, full_tag_query: fullquery, tag_query_entry: query_entry}
}
async function querySub({entry, data, field}) {
  // query subdocument in a subdocument array (like tags, metadatas)
  let result, rawquery, fullquery
  let query_key = field.slice(0, -1) // tags, catalogues, relations, metadatas
  if ('id' in data) {
    result = entry[field].find(_ => _.id === data.id )
    if (!result)
      throw Error(`id ${data.id} not exists in ${field}\nentry:${JSON.stringify(entry,null,2)}\ndata:${JSON.stringify(entry,null,2)}\nfield:${field}`)
    return result
  } else if ('__query__' in data) {
    fullquery = data
    let query = data.__query__
    delete fullquery.__query__

    let {tag_query_id} = await queryTaglikeID({field, query})
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
  let thisWiths = sub ? SubWiths : Withs
  if (field.indexOf('.') >= 0)  {
    [fieldPrefix, ...fieldSuffix] = field.split('.')
    fieldSuffix = fieldSuffix.join('.')
  } else {
    fieldPrefix = field
    fieldSuffix = ''
  }
  newdata = data[fieldPrefix]
  if (!newdata) throw Error(`should provide data with field: ${field} in model ${model}`)
  if (!thisWiths[model].includes(fieldPrefix)) throw Error(`no field ${field} found in model ${model}`)
  if (!APIs[`${fieldPrefix}API`]) throw Error(`Do not have api for ${field}`)
  return {newdata, fieldPrefix, fieldSuffix}
}
async function apiSingleField ({operation, model, field, data, entry, query, meta}) {
  let withs, simple, result

  let {fieldPrefix, fieldSuffix, newdata} = extractSingleField({model, field, data})
  let thisresult = await APIs[`${fieldPrefix}API`]({operation, prefield: model+`-${fieldPrefix}`, field: fieldSuffix, entry, data: newdata})

  withs = {[fieldPrefix]: thisresult}
  simple = await entry.save()
  result = simple
  let modelID = simple.id
  // add transaction here
  let history = new Models.History({
    operation, modelID, model, field, data, query, result, withs, meta,
  }); await history.save();
  return {operation, modelID, model, field, data, query, result, withs, meta}
}

function extractWiths ({ data, model, sub }) {
  // seperate simple field and complicated fileds (with WithXXXApi)
  // if sub, data is already a subdocument, search recursively (e.g., flags in tags in article)
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
  // modify subdocument(or subsubdocument) for each model
  let thisWiths // what field to process
  if (operation === '-') { // delete all withs before delete the main entry
    if (sub) {
      thisWiths = SubWiths[sub]
    } else {
      thisWiths = Withs[prefield]
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
      data: withs[key]
    })
    result[key] = thisresult
  }
  return result
}
async function api ({ operation, data, query, model, meta, field }) {
  /*
    operations: '+', '-', '*' or 'o',
    data: data to add/modify or delete
    query, model: model is always needed, query is needed in -*o
    field is needed when you want to operate the subfield instead of the entry
  */
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
      }); await history.save();
      return {operation, modelID, model, field, data, query, result, withs, meta}
    } else { // e.g. add new tag, add new catalogues
      let entry = await Model.find(query)
      if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
      entry = entry[0]

      let result = await apiSingleField({operation, model, field, data, entry, query, meta})
      return result
    }
  } else if (operation === '*') { // modify top models (simple fields and nested fields)
    let entry = await Model.find(query)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
    entry = entry[0]

    if (!field) {
      let {simple, withs} = extractWiths({data, model})
      entry.set(simple)
      let thisresult = await processWiths({operation, prefield: model, field, entry, withs})
      withs = thisresult

      simple = await entry.save()
      let result = simple
      let modelID = result.id
      // add transaction here
      let history = new Models.History({
        operation, modelID, model, field, data, query, result, withs, meta
      }); await history.save();
      return {operation, modelID, model, field, data, query, result, withs, meta}
    } else {
      let result = await apiSingleField({operation, model, field, data, entry, query, meta})
      return result
    }
  } else if (operation === '-') {
    let entry = await Model.find(query)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${JSON.stringify(query,null,2)} not unique: ${entry}`)
    entry = entry[0]

    if (!field) {
      let withs = {}
      let thisresult = await processWiths({operation, prefield: model, field, entry, withs})
      withs = thisresult

      let simple = await entry.remove()
      let result = simple
      let modelID = result.id
      // add transaction here
      let history = new Models.History({
        operation, modelID, model, field, data, query, result, withs, meta
      }); await history.save();
      return {operation, modelID, model, field, data, query, result, withs, meta}
    } else {
      let result = await apiSingleField({operation, model, field, data, entry, query, meta})
      return result
    }
  } else if (operation === 'o') {
    let entry = await Model.find(query)
    if (entry.length != 1) throw Error(`(${operation}, ${model}) entry with query: ${query} not unique: ${entry}`)
    entry = entry[0]

    if (!field) {
      throw Error(`for ${model}, can only reorder its Tags, Metadatas, Relations or Catalogues`)
    } else {
      let result = await apiSingleField({operation, model, field, data, entry, query, meta})
      return result
    }
  } else {
    throw Error(`operation should be one of '+', '-', '*', not ${operation}`)
  }
}

async function toNextField({operation, prefield, field, entry, eachdata, name}) {
  // process flags
  let this_sub_entry = await querySub({entry, data: eachdata, field: name})
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
    data: newdata
  })
  return {[fieldPrefix]: thisresult}
}

async function flagsAPI ({operation, prefield, field, entry, data}) {
  // field should always be '' or undefined, because flags do not have subfields
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
  } else if (operation === 'o') {
    throw Error('can not reorder a flag!')
  }
}

async function DFSSearch({model, id, entry, path, type}) {
  if (!entry) {
    let r = await Models[model].find({id})
    if (r.length !== 1) throw Error(`not single result when query ${model} with ${id}\nmodel:${model} id:${id} entry:${entry}, path:${path}, type:${type}`)
    entry = r[0]
  }
  if (!entry[type] || entry[type].lenth === 0) return null // successfully terminate here
  let items = entry[type].map(_ => _.id)
  for (let id of items) {
    let next = [...path, id]
    if (path.includes(id)) return next
    let result = await DFSSearch({model, id, path:next, type})
    if (result) return result
  }
}
async function testFamilyLoop({model, entry}) {
  let cycle
  cycle = await DFSSearch({model, entry, path: [entry.id], type: 'fathers'})
  if (cycle) return cycle.join("=>")
  cycle = await DFSSearch({model, entry, path: [entry.id], type: 'children'})
  if (cycle) return cycle.join("<=")
  return false
}

async function familyAPI ({operation, prefield, field, entry, data, type}) {
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
      let r = await Models[model].find(queryData)
      if (r.length !== 1) throw Error(`not single result when query ${model} with ${each}`)
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
    let loop = await testFamilyLoop({model, entry})
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
async function fathersAPI ({operation, prefield, field, entry, data}) {
  return await familyAPI({operation, prefield, field, entry, data, type:'fathers'})
}
async function childrenAPI ({operation, prefield, field, entry, data}) {
  return await familyAPI({operation, prefield, field, entry, data, type:'children'})
}

/* comment:
  * do not reject duplicate metadatas
  * for catalogues, tags and relations, check duplicate in front end
  * for auto added tags, ignore duplicated tags when added
*/
async function taglikeAPI ({name, operation, prefield, field, data, entry}) {
  // tags, catalogues, metadatas, relations
  const query_key = name.slice(0,-1)+'_id' // key to query subdocument array, e.g. tag_id in tags field
  let tpath = prefield
  let tmodel = name[0].toUpperCase() + name.slice(1,-1)
  let result = []
  let entry_model = entry.schema.options.collection
  let entry_id = entry.id
  let other_entry

  if (field) { // e.g. metadatas.flags, tags.flags
    let result = []
    for (let eachdata of data) {
      let this_sub_entry = await querySub({entry, data: eachdata, field: name})
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
        data: newdata
      })
      let this_result = {[fieldPrefix]: thisresult, id: this_sub_entry.id}
      result.push(this_result)
      if (name === 'relations') { // relationsFieldHook
        let {other_model, other_id} = this_sub_entry
        let other_entry = await Models[other_model].find({id: other_id}) // process this later, so use the global name
        if (other_entry.length !== 1) {
          throw Error(`can not get unique entry for ${other_model} by id:${other_id}`)
        }
        other_entry = other_entry[0]
        let that_sub_entry = other_entry[name].find(_ => _.id === this_sub_entry.id)
        Object.assign(that_sub_entry, this_result)
        other_entry.markModified(name)
        await other_entry.save()
      }
    }
    return result
  } else {
    if (operation === '+') { // data should be array
      for (let eachdata of data) {
        let {simple, withs} = extractWiths({data: eachdata, model: name, sub: true})
        simple.id = await getNextSequenceValue(prefield)
        // fullquery delete the query_key, only have query_key_id
        // query_entry is the entry for the 'Tag'
        // let {query_id, rawquery, fullquery, query_entry} = await queryTaglikeID({field: name, query: simple, getEntry:true})
        let {tag_query_id, raw_tag_query, full_tag_query, tag_query_entry} = await queryTaglikeID({field: name, query: simple, getEntry:true})
        if (name === 'relations') { // relationsCreateHookBeforeWiths
          let relationInfo = extractRelationInfo({full_tag_query, entry_model, entry_id})
          let {
            other_model, other_id,
            aorb, other_aorb,
            from_id, from_model,
            to_id, to_model,
          } = relationInfo
          other_entry = await Models[other_model].find({id: other_id})
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

        withs = await processWiths({operation, prefield, field: null, entry: this_sub_entry, withs, sub: name})
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
      }
      return result
    } else if (operation === '*') {
      let this_tag_model = name[0].toUpperCase() + name.slice(1, -1)
      for (let eachdata of data) {
        eachdata = Object.assign({}, eachdata)
        let eachdataraw = Object.assign({}, eachdata)
        // eachdata delete __query__
        let this_sub_entry = await querySub({entry, data: eachdata, field: name})
        let {simple, withs} = extractWiths({data:eachdata, model: name, sub: true})
        // fullquery delete the query_key, only have query_key_id
        let {tag_query_id, raw_tag_query, full_tag_query, tag_query_entry} = await queryTaglikeID({field: name, query: simple, test:true, getEntry: true})

        let relationChangeOtherFlag = false
        let oldTag, newTag
        if (name === 'relations') { // relationsModifyHookBeforeWiths
          let old_sub_relation = extractRelationInfo({full_tag_query: this_sub_entry, entry_model, entry_id})
          let new_sub_relation = extractRelationInfo({full_tag_query, entry_model, entry_id, old:this_sub_entry})
          let old_other_entry

          other_entry = await Models[new_sub_relation.other_model].find({id: new_sub_relation.other_id}) // process this later, so use the global name
          if (other_entry.length !== 1) {
            throw Error(`can not get unique entry for ${other_model} by id:${other_id}`)
          }
          other_entry = other_entry[0]
          // delete old sub_relations in old other_entry
          if (old_sub_relation.other_id !== new_sub_relation.other_id || old_sub_relation.other_model !== new_sub_relation.other_model) {
            old_other_entry = await Models[old_sub_relation.other_model].find({id: old_sub_relation.other_id}) // delete this
            if (old_other_entry.length !== 1) {
              throw Error(`can not get unique entry for ${old_sub_relation.other_model} by id:${old_sub_relation.other_id}`)
            }
            old_other_entry = old_other_entry[0]
            old_other_entry[name] = old_other_entry[name].filter(_ => _.id !== this_sub_entry.id)
            old_other_entry.markModified(name)
            await old_other_entry.save()

            let old_code = `${old_other_entry.id}-${this_sub_entry.id}`
            let new_code = `${other_entry.id}-${this_sub_entry.id}`
            let r = await Models[this_tag_model].find({id: this_sub_entry[query_key]})
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
            let r = await Models[this_tag_model].find({id: this_sub_entry[query_key]})
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
        simple[query_key] = this_sub_entry[query_key]
        withs = await processWiths({operation, prefield, field: null, entry: this_sub_entry, withs, sub: name})
        let thisresult = Object.assign({}, simple, withs)
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
      }
      return result
    } else if (operation === '-') {
      let this_tag_model = name[0].toUpperCase() + name.slice(1, -1)
      let entries = []
      if (data) {
        for (let eachdata of data) {
          let this_sub_entry = await querySub({entry, data: eachdata, field: name})
          entries.push(this_sub_entry)
        }
      } else {
        entries = entry[name].map(_ => _)
      }
      for (let this_sub_entry of entries) {
        let simple = {}
        let withs = {}
        withs = await processWiths({operation, prefield, field: null, entry: this_sub_entry, withs, sub: name})

        simple.id = this_sub_entry.id
        simple[query_key] = this_sub_entry[query_key]
        this_sub_entry.remove()
        let thisresult = Object.assign({}, simple, withs)
        result.push(thisresult)

        let r = await Models[this_tag_model].find({id: this_sub_entry[query_key]})
        if (r.length !== 1) throw Error(`not single result when query ${{id: this_sub_entry[query_key]}} in ${this_tag_model}`)
        let taglike = r[0]
        let code = `${entry.id}-${this_sub_entry.id}`
        taglike.r[entry_model] = taglike.r[entry_model].filter(_ => _ !== code)
        await taglike.save()

        if (name === 'relations') { // relationsDeleteHook
          let {other_model, other_id} = this_sub_entry
          let other_entry = await Models[other_model].find({id: other_id}) // process this later, so use the global name
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
      }
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
async function metadatasAPI ({operation, prefield, field, data, entry}) {
  // field could be flags, that's to `operate` flags instead of metadata
  const name = "metadatas"
  return await taglikeAPI({name, operation, prefield, field, data, entry})
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
async function relationsAPI ({operation, prefield, field, data, entry}) {
  // field could be flags, that's to `operate` flags instead of metadata
  const name = "relations"
  return await taglikeAPI({
    name,
    operation,
    prefield,
    field,
    data,
    entry,
    //createHook: relationsCreateHook,
    //modifyHook: relationsModifyHook,
  })
}

async function cataloguesAPI ({operation, prefield, field, data, entry}) {
  const name = "catalogues"
  return await taglikeAPI({name, operation, prefield, field, data, entry})
}
async function tagsAPI ({operation, data, entry, field}) {
  const name = "tagsAPI"
  return await taglikeAPI({name, operation, prefield, field, data, entry})
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
// 2. add subdocuments (e.g., tags in Article)
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
// 5. generate reverse field for Tag, Metadata, Relation and Catalogue
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
