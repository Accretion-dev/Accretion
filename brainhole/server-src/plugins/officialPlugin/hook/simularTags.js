import globals from "../../../globals"
import _ from 'lodash'

async function addSingleSimularTags({entry, subtag, session}) {
  let todo = {}
  let tags
  let result = {
    model, field: 'tags', data: [
      {id: entry.id}
    ]
  }

  // if not given newtags, addSimularTags for all possible tag
  for (let relationID of hook.hookData.relationIDs) { // for each relation
    let {symmetric, aorbAdd, relation} = hook.hookData.relations[relationID]
    if (!newtag) {
      if (relation.symmetric) {
        tags = globals.Models.Tag.aggregate([
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
        tags = globals.Models.Tag.aggregate([
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
      if (session) tags = tags.session(session)
      tags = await tags
    } else {
      let subrelationIDs
      if (symmetric) {
        subrelationIDs = newtag.relations.filter(__ => __.relation_id === relation.id).map(_ => _.id)
      } else {
        subrelationIDs = newtag.relations.filter(__ => __.relation_id === relation.id && __.aorb === relation.aorbAdd).map(_ => _.id)
      }
      tags = globals.Models.Tag.aggregate([
        {
          $match: {
            'relations.id': {
              $in: subrelationIDs
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
      if (session) tags = tags.session(session)
      tags = await tags
    }
    let tagIDs = tags.map(_ => _.id)
    let Tags = {}
    for (let tag of tags) {
      let todo
      if (symmetric) {
        todo = tag.relations.filter(__ => __.relation_id === relation.id).
               map(_ => ({id: _.id, other_id: _.other_id}))
      } else {
        todo = tag.relations.filter(__ => __.relation_id === relation.id && __.aorb === aorbAdd).
               map(_ => ({id: _.id, other_id: _.other_id}))
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
            let {id, other_id} = eachtodo
            toAddTags.push({
              tag_id: other_id,
              origin: [{id:`${hook.uid}-${id}`, hook:hook.uid}]
            })
          }
        }
      }
    }
  }
  result = result.filter(_ => _.data.length)
  return result
}
async function delSingleSimularTags({entry, subtag}) {
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

  if (deltag) {


  } else {
    for (let relationID of hook.hookData.relationIDs) { // for each relation
      let {symmetric, aorbAdd, relation} = hook.hookData.relations[relationID]
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
  }
  result = result.filter(_ => _.data.length)
  return result
}

async function addAllSimularTags() {
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

  for (let relationID of hook.hookData.relationIDs) { // for each relation
    let {symmetric, aorbAdd, relation} = hook.hookData.relations[relationID]
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
            toAddTags.push({
              tag_id: other_id,
              origin: [{id:`${hook.uid}-${id}`, hook:hook.uid, relation_name: relation.name, other_id: this_id}]
            })
          }
        }
      }
    }
  }
  result = result.filter(_ => _.data.length)
  return result
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

  for (let relationID of hook.hookData.relationIDs) { // for each relation
    let {symmetric, aorbAdd, relation} = hook.hookData.relations[relationID]
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
  let toAdd = await addAllSimularTags()
  let result = await globals.bulkOP({operation:"+", data: toAdd, meta, origin})
  return result
}
async function turnOff ({meta}) {
  console.log(`turn off ${hook.uid}`)
  let origin = { id: hook.uid, hook: hook.uid }
  let toDel = await delAllSimularTags()
  let result = await globals.bulkOP({operation:"-", data: toDel, meta, origin})
  return result
}

let data = [{model: 'Relation', data:[
  {name: 'simular', symmetric: true},
  {name: 'translation', symmetric: true},
  {name: 'disambiguation', symmetric: false},
]}]

// this is a function generator, it return the real hook function with parameters
async function gen(parameters) {
  hook.hookData = {
    tagsDict: new Map()
  }
  let relations = {}
  let relationIDs = []
  for (let relation of parameters.relations) {
    let r = await globals.Models.Relation.findOne({name: relation.name})
    relations[r.id] = {symmetric: r.symmetric, aorbAdd: relation.aorbAdd, relation: r}
    relationIDs.push(r.id)
  }
  Object.assign(hook.hookData, {relations, relationIDs})
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
    let todotags = []

    if (operation === '-') {
      tagsDict = hook.hookData.tagsDict.get(session)
      if (!tagsDict) return []
      hook.hookData.tagsDict.delete(session)
    }
    for (let relationID of hook.hookData.relationIDs) {
      let {symmetric, aorbAdd, relation} = hook.hookData.relations[relationID]
      tagIDs = withs.tags.map(_ => _.tag_id)
      if (operation === '+') {
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
          ])
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
          ])
        }
        if (!tags.length) continue // exit hook
      } else if (operation === '-') {
        tags = tagsDict[relationID]
      }
      if (!tags) continue
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
        for (let subtag of entry.tags) {
          if (!Tags[subtag.tag_id]) continue
          for (let eachtodo of Tags[subtag.tag_id].todo) {
            let {id, other_id, this_id} = eachtodo
            todotags.push({
              tag_id: other_id,
              origin: [{id:`${hook.uid}-${id}`, hook:hook.uid, relation_name: relation.name, other_id: this_id}]
            })
          }
        }
      } else if (operation === '*') {
        // tagChanged flag?
      } else if (operation === '-') {
        for (let subtag of withs.tags) {
          if (!Tags[subtag.tag_id]) continue
          for (let eachtodo of Tags[subtag.tag_id].todo) {
            let {id, other_id, this_id} = eachtodo
            todotags.push({
              __query__: {tag_id: other_id},
              origin: [{id:`${hook.uid}-${id}`, hook:hook.uid, relation_name: relation.name, other_id: this_id}]
            })
          }
        }
      }
    }
    if (!todotags.length) return [] // exit hook

    if (operation === "+" || operation === '*') {
      operation = "+"
    }
    let final = {
      operation, data: [{
        model, field: 'tags', data:[{
          id: entry.id, tags: todotags
        }]
      }], meta, origin: [{
        id: `${hook.uid}-should-not-exists`
      }]
    }
    return [final]
  }
  simularTagOPs.test = ({operation, meta, origin, model, data, field, entry, session}) => {
    let bad
    // prevent for self hookAction loop
    if (Array.isArray(origin)) {
      if (origin.length) { // origin = [] means delete all origins
        bad = origin.some(_ => _.id.startsWith(hook.uid))
      } else {
        bad = false
      }
    } else {
      bad = origin.id.startsWith(hook.uid)
    }
    return !bad
  }
  simularTagOPs.preDelete = async ({operation, meta, origin, model, data, field, entry, session}) => {
    if (!entry.tags.length) return []
    let tags, tagIDs, tagsDict = {}
    let todotags = []

    for (let relationID of hook.hookData.relationIDs) {
      let {symmetric, aorbAdd, relation} = hook.hookData.relations[relationID]
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
        ])
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
        ])
      }
      if (!tags.length) continue // exit hook
      tagsDict[relationID] = tags
    }
    hook.hookData.tagsDict.set(session, tagsDict)
  }
  let toReturn = {
    Relation: preventRelationDelete,
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
  function: gen,
  turnOn,
  turnOff
}
export default hook
