import globals from "../../../globals"
import _ from 'lodash'

async function addAllSimularTags() {
  let todo = {}
  let tags
  let result = []
  // resultDict['modelName']
  let resultDict = {}
  // resultDict['modelName'][entryID]
  let resultEntryDict = {}
  let thisMetaHookData = []
  for (let model of globals.WithsDict.WithTag) {
    let eachmodel = {
      model, field: 'tags', data: [],
    }
    result.push(eachmodel)
    resultDict[model] = eachmodel
    resultEntryDict[model] = {}
  }

  for (let relationID of hook.runtimeData.relationIDs) { // for each relation
    let {symmetric, aorbAdd, relation} = hook.runtimeData.relations[relationID]
    if (relation.symmetric) {
      tags = await globals.Models.Tag.aggregate([
        {
          $match: {
            relations: {
              $elemMatch: {
                relation_id: relation.id,
                other_model: 'Tag',
              }
            }
          }
        },
        {
          $project: {
            id: 1,
            name: 1,
            relations: 1
          }
        }
      ])
    } else {
      tags = await globals.Models.Tag.aggregate([
        {
          $match: {
            relations: {
              $elemMatch: {
                relation_id: relation.id,
                other_model: 'Tag',
                aorb: aorbAdd
              }
            }
          }
        },
        {
          $project: {
            id: 1,
            name: 1,
            relations: 1
          }
        }
      ])
    }
    tags = await tags
    let tagIDs = tags.map(_ => _.id)
    let Tags = {}
    for (let tag of tags) {
      let todo
      if (symmetric) {
        todo = tag.relations.filter(__ => __.relation_id === relation.id).
               map(_ => ({id: _.id, other_id: _.other_id, this_id: tag.id}))
      } else {
        todo = tag.relations.filter(__ => __.relation_id === relation.id && __.aorb === aorbAdd).
               map(_ => ({id: _.id, other_id: _.other_id, this_id: tag.id}))
      }
      tag.todo = todo
      Tags[tag.id] = tag
    }

    for (let model of globals.WithsDict.WithTag) {
      let entries = await globals.Models[model].aggregate([
        {$match: {
          'tags.tag_id': { $in: tagIDs }
        }},
        {$project: {id: 1, tags: 1}}
      ])
      for (let entry of entries) {
        if (!resultEntryDict[model][entry.id]) {
          let toAdd = {
            id: entry.id,
            tags: [],
          }
          resultDict[model].data.push(toAdd)
          resultEntryDict[model][entry.id] = toAdd
        }
        let toAddTags = resultEntryDict[model][entry.id].tags
        for (let subtag of entry.tags) {
          if (!Tags[subtag.tag_id]) continue
          for (let eachtodo of Tags[subtag.tag_id].todo) {
            let {id, other_id, this_id} = eachtodo
            thisMetaHookData.push(`${relation.name}-${model}-${entry.id}-${this_id}-${other_id}`)
            toAddTags.push({
              tag_id: other_id,
              origin: [{id:`${hook.uid}-${id}`, hook:hook.uid, relation_name: relation.name, other_id: this_id, other_name: Tags[this_id].name}]
            })
          }
        }
      }
    }
  }
  result = result.filter(_ => _.data.length)
  return {result, thisMetaHookData}
}
async function delAllSimularTags() {
  let todo = {}
  let tags
  let result = []
  // resultDict['modelName']
  let resultDict = {}
  // resultDict['modelName'][entryID]
  let resultEntryDict = {}
  for (let model of globals.WithsDict.WithTag) {
    let eachmodel = {
      model, field: 'tags', data: []
    }
    result.push(eachmodel)
    resultDict[model] = eachmodel
    resultEntryDict[model] = {}
  }

  for (let relationID of hook.runtimeData.relationIDs) { // for each relation
    let {symmetric, aorbAdd, relation} = hook.runtimeData.relations[relationID]
    for (let model of globals.WithsDict.WithTag) {
      let entries = await globals.Models[model].aggregate([
        {$match: {
          'tags.origin.hook': hook.uid
        }},
        {$project: {id: 1, tags: 1}}
      ])
      for (let entry of entries) {
        if (!resultEntryDict[model][entry.id]) {
          let toDel = {
            id: entry.id,
            tags: [],
          }
          resultDict[model].data.push(toDel)
          resultEntryDict[model][entry.id] = toDel
        }
        let toDelTags = resultEntryDict[model][entry.id].tags
        for (let subtag of entry.tags) {
          if (!subtag.origin.some(_ => _.hook === hook.uid)) continue
          let origin = subtag.origin.filter(_ => _.hook === hook.uid).map(_ => ({id: _.id}))
          toDelTags.push({
            id: subtag.id,
            origin,
          })
        }
      }
    }
  }

  result = result.filter(_ => _.data.length)
  return result
}

async function turnOn ({meta}) {
  console.log(`turn on ${hook.uid}`)
  let origin = { id: hook.uid, hook: hook.uid }
  let {result, thisMetaHookData} = await addAllSimularTags()
  // this will block simularTagOPs hook
  let thismeta = Object.assign({}, meta, {[hook.uid]: thisMetaHookData})
  result = await globals.bulkOP({operation:"+", data: result, meta: thismeta, origin})
  return result
}
async function turnOff ({meta}) {
  console.log(`turn off ${hook.uid}`)
  let origin = { id: hook.uid, hook: hook.uid }
  let toDel = await delAllSimularTags()
  // this will block simularTagOPs hook
  let thismeta = Object.assign({}, meta, {[`${hook.uid}-operation`]: true})
  let result = await globals.bulkOP({operation:"-", data: toDel, meta: thismeta, origin})
  return result
}

let data = [{model: 'Relation', data:[
  {name: 'simular', symmetric: true},
  {name: 'translation', symmetric: true},
  {name: 'disambiguation', symmetric: false},
]}]

async function deleteSingleNullLoopTags ({model, query}) {
  let result = {
    model,
    field: 'tags',
    data: [],
  }
  let thisquery = Object.assign({}, query, {
    tags: {
      $elemMatch: {
        $and: [
          {'origin.hook': hook.uid},
          {$not:{'origin.id': 'manual'}}
        ]
      }
    }
  })
  let entries = await globals.Models[model].find(query)
  let todo = {}
  for (let entry of entries) {
    let derive= {}
    let tags = entry._doc.tags
    for (let tag of tags) {
      let fathers = tag.origin.filter(_ => _.hook === hook.uid).map(_ => _.other_id)
      fathers = Array.from(new Set(fathers))
      for (let father of fathers) {
        if (!derive[father]) derive[father] = []
        derive[father].push(tag.tag_id)
      }
    }
    let manualTags = new Set(tags.filter(_ => _.origin.some(_ => _.id === 'manual')).map(_ => _.tag_id))
    let newManualTags = [...manualTags]
    while (true) {
      let thisNewManualTags = []
      for (let id of newManualTags) {
        for (let eachnew of derive[id]) {
          if (!manualTags.has(eachnew)) {
            manualTags.add(eachnew)
            thisNewManualTags.push(eachnew)
          }
        }
      }
      if (!thisNewManualTags.length) {
        newManualTags = thisNewManualTags
      } else {
        break
      }
    }
    let nullLoopTags = [...tags.map(_ => _.tag_id).filter(_ => !manualTags.has(_))] // from _doc to Array
    if (nullLoopTags.length) {
      result.data.push({
        id: entry.id,
        tags: nullLoopTags.map(_ => ({
          __query__: {tag_id: _}
        }))
      })
    }
  }
  return result
}
async function deleteNullLoopTags ({model, query}) {
  let thisresult
  let data = []
  let todos = {
    operation: '-',
    origin: [],
    // no recursive hook
    meta: {[`${hook.uid}-operation`]: true, noHook: true, deleteNullLoopTags: true},
    data,
  }
  if (model) {
    if (!query) {
      query = {}
    }
    thisresult = await deleteSingleNullLoopTags({model, query})
    if (thisresult.data.length) {
      data.push(thisresult)
    }
  } else {
    for (let model of globals.WithsDict.WithTag) {
      if (!query) {
        query = {}
      }
      thisresult = await deleteSingleNullLoopTags({model, query})
      if (thisresult.data.length) {
        data.push(thisresult)
      }
    }
  }
  await globals.bulkOP(todos)
}
let functions = {
  deleteNullLoopTags
}

// this is a function generator, it return the real hook function with parameters
async function hookGenerator(parameters) {
  hook.runtimeData = {
    tagsDict: new Map(),
    beforeDeleteRelationDict: new Map(),
  }
  let relations = {}
  let relationIDs = []
  for (let relation of parameters.relations) {
    let r = await globals.Models.Relation.findOne({name: relation.name})
    relations[r.id] = {symmetric: r.symmetric, aorbAdd: relation.aorbAdd, relation: r}
    relationIDs.push(r.id)
  }
  Object.assign(hook.runtimeData, {relations, relationIDs})
  // this function will be injected into the taglikeAPI
  async function preventRelationDelete ({operation, result, meta, origin, origin_flags, model, withs, data, field, entry}) {
    return []
  }
  preventRelationDelete.preDelete = async ({operation, result, meta, origin, origin_flags, model, withs, data, field, entry}) => {
    if (operation==='-'&&!field) {
      if (relationIDs.includes(entry.id)) {
        if (origin_flags.entry) {
          throw Error(`The hook:${hook.uid} is active, you can not delete this relations:${entry.name}, turn off the hook first`)
        }
      }
    }
  }
  async function simularTagOPs({operation, result, meta, origin, origin_flags, model, withs, data, field, entry, oldEntry, session}) {
    if (!withs.tags) return []
    let tags, tagIDs, tagsDict
    let entry_model = entry.schema.options.collection
    let todotags = []
    let thisMetaHookData = []
    let metaHookData

    if (operation === '-') {
      if (!field) return [] // topModel is deleted, no need to make hookActions
      tagsDict = hook.runtimeData.tagsDict.get(session)
      if (!tagsDict) return []
      hook.runtimeData.tagsDict.delete(session)
    }

    if (meta&&meta[hook.uid]) {
      metaHookData = meta[hook.uid]
    } else {
      metaHookData = []
    }

    for (let relationID of hook.runtimeData.relationIDs) {
      let {symmetric, aorbAdd, relation} = hook.runtimeData.relations[relationID]
      tagIDs = withs.tags.map(_ => _.tag_id)
      if (operation === '+' || operation === '*') {
        if (relation.symmetric) {
          tags = await globals.Models.Tag.aggregate([
            {
              $match: {
                id: {$in: tagIDs},
                relations: {
                  $elemMatch: {
                    relation_id: relation.id,
                    other_model: 'Tag',
                  }
                }
              }
            },
            {
              $project: {
                id: 1,
                name: 1,
                relations: 1
              }
            }
          ]).session(session)
        } else {
          tags = await globals.Models.Tag.aggregate([
            {
              $match: {
                id: {$in: tagIDs},
                relations: {
                  $elemMatch: {
                    relation_id: relation.id,
                    other_model: 'Tag',
                    aorb: aorbAdd
                  }
                }
              }
            },
            {
              $project: {
                id: 1,
                name: 1,
                relations: 1
              }
            }
          ]).session(session)
        }
      } else if (operation === '-') {
        tags = tagsDict[relationID]
      }
      if (!tags ||(tags&&!tags.length)) continue // exit hook
      let Tags = {}

      for (let tag of tags) {
        let todo
        if (symmetric) {
          todo = tag.relations.filter(__ => __.relation_id === relation.id).
                 map(_ => ({id: _.id, other_id: _.other_id, this_id: tag.id}))
        } else {
          todo = tag.relations.filter(__ => __.relation_id === relation.id && __.aorb === aorbAdd).
                 map(_ => ({id: _.id, other_id: _.other_id, this_id: tag.id}))
        }
        tag.todo = todo
        Tags[tag.id] = tag
      }

      if (operation === "+") {
        for (let subtag of withs.tags) {
          if (!Tags[subtag.tag_id]) continue
          for (let eachtodo of Tags[subtag.tag_id].todo) {
            let {id, other_id, this_id} = eachtodo
            if (metaHookData.length) {
              if (!subtag.origin_flags.entry) continue
              if (metaHookData.includes(`${relation.name}-${entry_model}-${entry.id}-${other_id}-${this_id}`)) continue
              if (thisMetaHookData.includes(`${relation.name}-${entry_model}-${entry.id}-${other_id}-${this_id}`)) continue
              thisMetaHookData.push(`${relation.name}-${entry_model}-${entry.id}-${this_id}-${other_id}`)
            } else {
              thisMetaHookData.push(`${relation.name}-${entry_model}-${entry.id}-${this_id}-${other_id}`)
            }
            todotags.push({
              tag_id: other_id,
              origin: [{id:`${hook.uid}-${id}`, hook:hook.uid, relation_name: relation.name, other_id: this_id, other_name: Tags[this_id].name}]
            })
          }
        }
      } else if (operation === '*') {
        for (let subtag of withs.tags) {
          // for the modification that change this tag to a tag with special relation
          //if (!subtag.modify_flags.changeTaglike) continue
          if (!Tags[subtag.tag_id]) continue
          for (let eachtodo of Tags[subtag.tag_id].todo) {
            let {id, other_id, this_id} = eachtodo
            if (metaHookData.length) {
              if (!subtag.modify_flags.entry) continue
              if (metaHookData.includes(`${relation.name}-${entry_model}-${entry.id}-${other_id}-${this_id}`)) continue
              if (thisMetaHookData.includes(`${relation.name}-${entry_model}-${entry.id}-${other_id}-${this_id}`)) continue
              thisMetaHookData.push(`${relation.name}-${entry_model}-${entry.id}-${this_id}-${other_id}`)
            } else {
              thisMetaHookData.push(`${relation.name}-${entry_model}-${entry.id}-${this_id}-${other_id}`)
            }
            todotags.push({
              tag_id: other_id,
              origin: [{id:`${hook.uid}-${id}`, hook:hook.uid, relation_name: relation.name, other_id: this_id, other_name: Tags[this_id].name}]
            })
          }
        }
      } else if (operation === '-') {
        for (let subtag of withs.tags) {
          if (!Tags[subtag.tag_id]) continue
          for (let eachtodo of Tags[subtag.tag_id].todo) {
            let {id, other_id, this_id} = eachtodo
            if (metaHookData.length) {
              if (!subtag.origin_flags.entry) continue
              if (metaHookData.includes(`${relation.name}-${entry_model}-${entry.id}-${other_id}-${this_id}`)) continue
              if (thisMetaHookData.includes(`${relation.name}-${entry_model}-${entry.id}-${other_id}-${this_id}`)) continue
              thisMetaHookData.push(`${relation.name}-${entry_model}-${entry.id}-${this_id}-${other_id}`)
            } else {
              thisMetaHookData.push(`${relation.name}-${entry_model}-${entry.id}-${this_id}-${other_id}`)
            }
            todotags.push({
              __query__: {tag_id: other_id},
              origin: [{id:`${hook.uid}-${id}`, hook:hook.uid, relation_name: relation.name, other_id: this_id, other_name: Tags[this_id].name}]
            })
          }
        }
      }
    }
    if (!todotags.length) return [] // exit hook

    if (operation === "+" || operation === '*') {
      operation = "+"
    }

    thisMetaHookData = [...metaHookData, ...thisMetaHookData]
    thisMetaHookData = Array.from(new Set(thisMetaHookData))

    let outputMeta = Object.assign({}, meta, {[hook.uid]: thisMetaHookData})

    let final = {
      operation, data: [{
        model, field: 'tags', data:[{
          id: entry.id, tags: todotags
        }]
      }], meta: outputMeta, origin: [{
        id: `${hook.uid}-should-not-exists`
      }]
    }
    return [final]
  }
  simularTagOPs.test = ({operation, meta, origin, model, data, field, entry, session}) => {
    // when turn on or turn off, we will meet large number of entries, no need to process them because all of them are included
    // but for operation for single entry, we need do it recursively
    if (meta[`${hook.uid}-operation`]) {
      return false
    } else {
      return true
    }
  }
  simularTagOPs.preDelete = async ({operation, meta, origin, model, data, field, entry, session}) => {
    if (!entry.tags.length) return []
    let tags, tagIDs, tagsDict = {}
    let todotags = []

    for (let relationID of hook.runtimeData.relationIDs) {
      let {symmetric, aorbAdd, relation} = hook.runtimeData.relations[relationID]
      tagIDs = entry.tags.map(_ => _.tag_id)
      if (!tagIDs.length) continue
      if (relation.symmetric) {
        tags = await globals.Models.Tag.aggregate([
          {
            $match: {
              id: {$in: tagIDs},
              relations: {
                $elemMatch: {
                  relation_id: relation.id,
                  other_model: 'Tag',
                }
              }
            }
          },
          {
            $project: {
              id: 1,
              name: 1,
              relations: 1
            }
          }
        ]).session(session)
      } else {
        tags = await globals.Models.Tag.aggregate([
          {
            $match: {
              id: {$in: tagIDs},
              relations: {
                $elemMatch: {
                  relation_id: relation.id,
                  other_model: 'Tag',
                  aorb: aorbAdd
                }
              }
            }
          },
          {
            $project: {
              id: 1,
              name: 1,
              relations: 1
            }
          }
        ]).session(session)
      }
      if (!tags.length) continue // exit hook
      tagsDict[relationID] = tags
    }
    hook.runtimeData.tagsDict.set(session, tagsDict)
  }
  async function changeRelation ({operation, result, meta, origin, origin_flags, model, withs, data, field, entry, oldEntry, session}) {
    let tags
    let doc = entry._doc
    if (!doc.relations) return
    let final = []
    // resultDict['modelName']
    let resultDict = {}
    let thisMetaHookData = []
    // resultDict['modelName'][entryID]
    let resultEntryDict = {}
    for (let model of globals.WithsDict.WithTag) {
      let eachmodel = {
        model, field: 'tags', data: []
      }
      final.push(eachmodel)
      resultDict[model] = eachmodel
      resultEntryDict[model] = {}
    }
    let thisRelationIDs, groups, thiswiths
    for (let subrelation of withs.relations) {
      if (!hook.runtimeData.relationIDs.includes(subrelation.relation_id)) continue
      if (operation === '*') {
        if (!subrelation.modify_flags.changeTaglike) continue
      } else {
        if (!subrelation.origin_flags.entry) continue
      }
      let {symmetric, aorbAdd, relation} = hook.runtimeData.relations[subrelation.relation_id]
      let this_id = entry.id
      let this_name = entry.name
      // if have from_id, another_id is from_id, same for the 'to_id'
      let other_key = subrelation.other_id ? "other_id" : (subrelation.to_id ? "to_id" : 'from_id')
      let that_id = subrelation[other_key]
      let this_tag = entry
      let that_tag = await globals.Models.Tag.findOne( { id: that_id } ).session(session)
      let Tags = {}
      let id = withs.relations.find(_ => _.relation_id === relation.id && _[other_key] === that_id)
      id = id.id

      if (symmetric) {
        Tags[this_id] = Object.assign({}, this_tag._doc, {
          todo: [{id, other_id: that_id, this_id: this_id}]
        })
        Tags[that_id] = Object.assign({}, that_tag._doc, {
          todo: [{id, other_id: this_id, this_id: that_id}]
        })
      } else {
        // a => b, aorbAdd is b means if the tag is b, add b will add a, not the reverse
        if (subrelation.aorb === aorbAdd) {
          Tags[this_id] = Object.assign({}, this_tag._doc, {
            todo: [{id, other_id: that_id, this_id: this_id}]
          })
        } else {
          Tags[that_id] = Object.assign({}, that_tag._doc, {
            todo: [{id, other_id: this_id, this_id: that_id}]
          })
        }
      }
      let tagIDs = Object.keys(Tags).map(_ => Number(_))

      for (let model of globals.WithsDict.WithTag) {
        let entries = await globals.Models[model].aggregate([
          {$match: {
            'tags.tag_id': { $in: tagIDs }
          }},
          {$project: {id: 1, tags: 1}}
        ]).session(session)
        for (let entry of entries) {
          if (!resultEntryDict[model][entry.id]) {
            let toAdd = {
              id: entry.id,
              tags: [],
            }
            resultDict[model].data.push(toAdd)
            resultEntryDict[model][entry.id] = toAdd
          }
          let toAddTags = resultEntryDict[model][entry.id].tags
          for (let subtag of entry.tags) {
            if (!Tags[subtag.tag_id]) continue
            // this todo only have a single object
            for (let eachtodo of Tags[subtag.tag_id].todo) {
              let toPush
              let {id, other_id, this_id} = eachtodo
              if (operation === '-') {
                let toDelete = entry.tags.find(_ => _.tag_id === other_id)
                if (toDelete) {
                  //console.log(`delete because of relation:${subrelation.relation_id}, ${toDelete.id}, tagid: ${toDelete.tag_id}(auto add by ${subtag.tag_id})`)
                  thisMetaHookData.push(`${relation.name}-${model}-${entry.id}-${this_id}-${other_id}`)
                  toPush = {
                    __query__: {tag_id: other_id},
                    origin: [{id:`${hook.uid}-${id}`, hook:hook.uid, relation_name: relation.name, other_id: this_id, other_name: Tags[this_id].name}]
                  }
                  toAddTags.push(toPush)
                }
              } else {
                thisMetaHookData.push(`${relation.name}-${model}-${entry.id}-${this_id}-${other_id}`)
                toPush = {
                  tag_id: other_id,
                  origin: [{id:`${hook.uid}-${id}`, hook:hook.uid, relation_name: relation.name, other_id: this_id, other_name: Tags[this_id].name}]
                }
                toAddTags.push(toPush)
              }
            }
          }
        }
      }
    }
    if (operation === "*") operation = '+'
    final = final.filter(_ => _.data.length)
    // this origin is only used to skip nested hook

    if (!meta) {
      meta = {[hook.uid]: thisMetaHookData}
    } else {
      if (!meta[hook.uid]) {
        meta[hook.uid] = thisMetaHookData
      } else {
        meta[hook.uid] = [...meta[hook.uid], ...thisMetaHookData]
        meta[hook.uid] = Array.from(new Set(meta[hook.uid]))
      }
    }

    origin = {id: `${hook.uid}-should-never-exists`, hook: hook.uid}
    let toReturn = { operation, data:final, origin, meta}
    //if (operation === '-') {
    //  console.log('changing relation of tag:', entry.id, entry.name, 'withs:', withs, toReturn)
    //  debugger
    //}
    return [toReturn]
  }
  changeRelation.test = async ({operation, result, meta, origin, origin_flags, model, withs, data, field, entry, oldEntry, session}) => {
    return true
  }

  let toReturn = {
    Relation: preventRelationDelete,
    Tag: changeRelation,
  }
  for (let model of globals.WithsDict.WithTag) {
    toReturn[model] = simularTagOPs
  }
  return toReturn
}
let hook = {
  uid: "simularTags",
  name: "simularTags",
  description: `Auto add simular tags with simular kind of relation.
  e.g.:
    Translation is a two way simular kind of relation, if tag A and tag B have the translation relation, when tag A is added(deleted), tag B should also be added(deleted), and vice versa.
    Disambiguation is a one way simular kind of relation, if tag A has a Disambiguation relation to tag B, when tag A is added(deleted), tag B should also be added(deleted), but NOT vice versa.
  `,
  priority: 10,
  parameters: {relations: [
    {name: 'simular'},
    {name: 'translation'},
    // for the relation a => b, b is auto added when a is added, not the reverse
    {name: 'disambiguation', aorbAdd: 'b'},
  ]},
  hookGenerator,
  turnOn,
  turnOff,
  data,
  functions,
}
export default hook
