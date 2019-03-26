import globals from "../../../globals"
import _ from 'lodash'

async function getSingleGroup ({groupRelation, session, thisid}) {
  let thisResult = {}
  thisResult.relation = groupRelation
  let thisGroupMatching = []
  let thisGroupMap = {}
  let thisAddData = []
  // all tags that have the group relations
  let tags_ = globals.Models.Tag.aggregate([
    {
      $match: {
        'relations.relation_id': groupRelation.id,
        'relations.other_model': 'Tag',
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
  if (session) tags_ = tags_.session(session)
  let tags = await tags_
  // calculate thisGroupMap, like
  //  {id0: [id0, id1, id2],id1: [id0, id1, id2],id2: [id0, id1, id2]}
  for (let tag of tags) {
    let thisid = tag.id
    let thatids = tag.relations.filter(_ => _.relation_id === groupRelation.id).map(_ => _.other_id)
    let fullids = [thisid, ...thatids]
    let done = false
    let thisMatch
    for (let each of thisGroupMatching) {
      let {data} = each
      let intersection = _.intersection(data, fullids)
      if (intersection.length) {
        done = true
        let __ = _.union(data, fullids)
        each.data = __
        thisMatch = each
        break
      }
    }
    if (!done) {
      let __ = {data: fullids}
      thisGroupMatching.push(__)
      thisMatch = __
    }
    thisGroupMap[thisid] = thisMatch
  }
  let exists = []
  if (session) debugger
  if (thisid) tags = tags.filter(_ => thisGroupMap[_.id].data.includes(thisid))
  for (let tag of tags) {
    let thisid = tag.id
    let thatids = tag.relations.filter(_ =>
      _.relation_id === groupRelation.id && !((_.origin.map(__ => __.id).includes(hook.uid)))
    ).map(_ => _.other_id)
    let fullids = thisGroupMap[thisid].data
    let newids = fullids
    let thisRelations = []
    let thisExists
    for (let newid of fullids) {
      // force all all groups (thanks to the origin features)
      if (newid > thisid) {
        thisExists = `${thisid}-${newid}`
        if (exists.includes(thisExists)) continue
        exists.push(thisExists)
        thisRelations.push({
          relation_id: groupRelation.id,
          from_id: newid,
        })
      } else if (newid < thisid) {
        thisExists = `${newid}-${thisid}`
        if (exists.includes(thisExists)) continue
        exists.push(thisExists)
        thisRelations.push({
          relation_id: groupRelation.id,
          to_id: newid,
        })
      }
    }
    thisAddData.push({
      id: thisid,
      relations:thisRelations
    })
  }
  if (session) debugger
  thisAddData = thisAddData.filter(_ => _.relations.length>0)
  thisResult.data = thisAddData
  thisResult.groupMap = thisGroupMap
  return thisResult
}
async function getGroupsAdd () {
  let groups = hook.parameters.groups
  let result = { }
  for (let group of groups) {
    let groupRelation = await globals.Models.Relation.find({name: group})
    if (!groupRelation.length) {
      continue
    } else if (groupRelation.length > 1) {
      throw Error(`error in hook ${hook.uid}: more than one relation named '${group}'`)
    }
    groupRelation = groupRelation[0]
    result[group] = await getSingleGroup({groupRelation})
  }
  return result
}
async function allGroupRelations (newdata) {
  if (!newdata) newdata = await getGroupsAdd()
  let result = {
    model: 'Tag',
    field: 'relations',
    data:[],
  }
  for (let group of Object.keys(newdata)) {
    for (let eachdata of newdata[group].data) {
      result.data.push(eachdata)
    }
  }
  return result
}
async function deleteAllGroupRelations () {
  let tags = await globals.Models.Tag.aggregate([
    {
      $match: {
        'relations.origin.id': hook.uid,
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
  let data = []
  let deletedIDs = [[]]
  for (let tag of tags) {
    let relations = tag.relations.filter(_ => {
      for (let eachorigin of _.origin) {
        if (eachorigin.id === hook.uid && !deletedIDs.includes(_.id)) {
          deletedIDs.push(_.id)
          return true
        }
      }
    })
    if (relations.length) {
      data.push({ id: tag.id, relations: relations.map(_ => ({id: _.id})) })
    }
  }
  let todo = {model: 'Tag', field:'relations', data}
  return todo
}
async function turnOn ({meta}) {
  console.log(`turn on ${hook.uid}`)
  let origin = { id: hook.uid }
  let toAdd = await allGroupRelations()
  let result = await globals.bulkOP({operation:"+", data: [toAdd], meta, origin})
  return result
}
async function turnOff ({meta}) {
  console.log(`turn off ${hook.uid}`)
  let origin = { id: hook.uid }
  let toDel = await deleteAllGroupRelations()
  let result = await globals.bulkOP({operation:"-", data: [toDel], meta, origin})
  return result
}

// this is a function generator, it return the real hook function with parameters
async function gen(parameters) {
  let hookData = {}
  let groups = parameters.groups
  let relationIDs = await globals.Models.Relation.find({name: {$in: groups}})
  relationIDs = relationIDs.map(_ => _.id)
  // this function will be injected into the taglikeAPI
  async function preventRelationDelete ({operation, result, meta, origin, origin_flags, model, withs, data, field, entry}) {
    if (operation==='-'&&!field) {
      if (relationIDs.includes(entry.id)) {
        if (origin_flags.entry) {
          throw Error(`The hook:${hook.uid} is active, you can not delete this relations:${entry.name}, turn off the hook first`)
        }
      }
    }
  }
  async function groupRelationTagOPs({operation, result, meta, origin, origin_flags, model, withs, data, field, entry, oldEntry, session}) {
    if (!withs || !withs.relations) return
    origin = { id: hook.uid }
    let thisRelationIDs, groups, final
    if (operation === "+") {
      thisRelationIDs = withs.relations.map(_ => _.relation_id)
      groups = _.intersection(thisRelationIDs, relationIDs)
      if (!groups.length) return
      // now we have least one new added group relation
      let groupRelations = withs.relations.filter(_ => relationIDs.includes(_.relation_id))
      let r = { }
      for (let id of groups) {
        let groupRelation = await globals.Models.Relation.findOne({id}).session(session)
        r[id] = await getSingleGroup({groupRelation, session, thisid: entry.id})
      }
      let toAdd = await allGroupRelations(r)
      final = {operation:"+", data: [toAdd], meta, origin}
      debugger
    } else if (operation === '*') {

    } else if (operation === '-') {

    }
    return [final]
  }
  return {
    Tag: groupRelationTagOPs,
    Relation: preventRelationDelete,
  }
}
let hook = {
  uid: "groupRelationTag",
  name: "groupRelationTag",
  description: "if a=>b, b=>c, then auto add a=>c",
  parameters: {groups: [
    'simular',
    'translation',
  ]},
  function: gen,
  turnOn,
  turnOff
}
export default hook