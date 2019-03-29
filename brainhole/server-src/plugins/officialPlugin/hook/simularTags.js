import globals from "../../../globals"
import _ from 'lodash'

async function getGroupMap({groupRelation, session}) {
  let thisGroupMatching = []
  let thisGroupMap = {}
  // all tags that have the group relations
  let tags_ = globals.Models.Tag.aggregate([
    {
      $match: {
        'relations.relation_id': groupRelation.id,
        'relations.other_model': 'Tag',
        'relations.origin.id': 'manual',
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
    let thatids = tag.relations.filter(
      _ => _.relation_id === groupRelation.id && _.origin.find(__ => __.id==='manual')
    ).map(_ => _.other_id)
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
  return {tags, thisGroupMap}
}
async function getSingleGroupAdd ({groupRelation, session, thisid}) {
  let {tags, thisGroupMap} = await getGroupMap({groupRelation, session})
  let thisResult = {}
  let thisAddData = []
  let exists = []
  if (thisid) tags = tags.filter(_ => thisGroupMap[_.id].data.includes(thisid))
  for (let tag of tags) {
    let thisid = tag.id
    // relations that already exists (and have this hook origin)
    let thatids = tag.relations.filter(_ =>
      _.relation_id === groupRelation.id && ((_.origin.find(__ => __.id === hook.uid)))
    ).map(_ => _.other_id)
    let fullids = thisGroupMap[thisid].data
    let newids = fullids = fullids.filter(_ => !thatids.includes(_))
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
          other_id: newid,
        })
      } else if (newid < thisid) {
        thisExists = `${newid}-${thisid}`
        if (exists.includes(thisExists)) continue
        exists.push(thisExists)
        thisRelations.push({
          relation_id: groupRelation.id,
          other_id: newid,
        })
      }
    }
    thisAddData.push({
      id: thisid,
      relations:thisRelations
    })
  }
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
    result[group] = await getSingleGroupAdd({groupRelation})
  }
  return result
}
async function addGroupRelations (newdata) {
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
async function delGroupRelations ({r, field, id}) {
  let thisData = []
  let result = {
    model: 'Tag',
    field: 'relations',
    data:thisData,
  }
  for (let group of Object.keys(r)) {
    let {tags, oldGroupMap, newGroupMap, groupRelation} = r[group]
    let relation_id = groupRelation.id
    let oldKeys = Object.keys(oldGroupMap)
    for (let key of oldKeys) {
      if (Number(key) === id && !field) {
        // delete the tag (and all its relations)
        // do not need hook action for this taa
        continue
      }
      let oldIDs, newIDs
      oldIDs = oldGroupMap[key].data
      if (!newGroupMap[key]) {
        newIDs = []
      } else {
        newIDs = newGroupMap[key].data
      }
      let toDels = oldIDs.filter(_ => !newIDs.includes(_))
      let toDelRelations = toDels.map(_ => ({
        __query__: {
          relation_id, other_id: _
        }
      }))
      if (toDelRelations.length) {
        thisData.push({id: Number(key), relations: toDelRelations})
      }
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
  let origin = { id: hook.uid, hook: hook.uid }
  let toAdd = await addGroupRelations()
  let result = await globals.bulkOP({operation:"+", data: [toAdd], meta, origin})
  return result
}
async function turnOff ({meta}) {
  console.log(`turn off ${hook.uid}`)
  let origin = { id: hook.uid, hook: hook.uid }
  let toDel = await deleteAllGroupRelations()
  let result = await globals.bulkOP({operation:"-", data: [toDel], meta, origin})
  return result
}

let data = [{model: 'Relation', data:[
  {name: 'simular', symmetric: true},
  {name: 'translation', symmetric: true},
  {name: 'disambiguation', symmetric: false},
]}]

// this is a function generator, it return the real hook function with parameters
async function gen(parameters) {
  let hookData = {
    oldMap: new Map()
  }
  let relations = {}
  let relationIDs = []
  for (let relation of parameters.relations) {
    let r = await globals.Models.Relation.findOne({name: relation.name})
    relations[r.id] = {symmetric: r.symmetric, aorbAdd: relation.aorbAdd}
    relationIDs.push(r.id)
  }
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
    return []

    let doc = entry._doc
    if (!doc.relations) return
    origin = { id: hook.uid, hook: hook.uid }
    let thisRelationIDs, groups, final
    if (operation === "+" || operation === "*") {
      thisRelationIDs = doc.relations.map(_ => _.relation_id)
      groups = _.intersection(thisRelationIDs, relationIDs)
      if (!groups.length) return
      // now we have least one new added group relation
      let groupRelations = doc.relations.filter(_ => relationIDs.includes(_.relation_id))
      let r = { }
      for (let id of groups) {
        let groupRelation = await globals.Models.Relation.findOne({id}).session(session)
        r[id] = await getSingleGroupAdd({groupRelation, session, thisid: entry.id})
      }
      let modified = await addGroupRelations(r)
      if (modified.data.length) {
        final = {operation:'+', data: [modified], meta, origin}
      } else {
        return []
      }
    } else if (operation === '*') {
    } else if (operation === '-') {
      if (!hookData.oldMap.has(session)) return []
      let groupResults = hookData.oldMap.get(session)
      hookData.oldMap.delete(session)
      let groups = Object.keys(groupResults)
      for (let id of groups) {
        let __ = groupResults[id]
        let {tags, thisGroupMap} = await getGroupMap({groupRelation: __.groupRelation, session})
        __.newGroupMap = thisGroupMap
      }
      let modified = await delGroupRelations({r: groupResults, field, id:entry.id})
      if (modified.data.length) {
        final = {operation, data: [modified], meta, origin}
      } else {
        return []
      }
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
    return
    if (!field || field === 'relations') {
      let thisRelationIDs = entry._doc.relations.map(_ => _.relation_id)
      let groups = _.intersection(thisRelationIDs, relationIDs)
      if (!groups.length) {
        return
      }
      let r = { }
      for (let id of groups) {
        let groupRelation = await globals.Models.Relation.findOne({id}).session(session)
        let {tags, thisGroupMap} = await getGroupMap({groupRelation, session})
        r[id] = {tags, oldGroupMap: thisGroupMap, groupRelation}
      }
      hookData.oldMap.set(session, r)
    }
  }
  return {
    //Tag: groupRelationTagOPs,
    Relation: preventRelationDelete,
  }
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
