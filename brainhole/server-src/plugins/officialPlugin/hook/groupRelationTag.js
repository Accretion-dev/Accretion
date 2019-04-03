import globals from "../../../globals"
import _ from 'lodash'

/* Calculate all groups given groupRelation and session
@return
  {tags, thisGroupMap}
    tags: all tags that involved in these groups
    thisGroupMap: {
      tag_id: [...id of tags in the group]
      ...
    }
*/
async function getGroupMap({groupRelation, session}) {
  let thisGroupMatching = []
  let thisGroupMap = {}
  // all tags that have the group relations
  let tags_ = globals.Models.Tag.aggregate([
    {
      $match: {
        relations: {
          $elemMatch: {
            relation_id: groupRelation.id,
            other_model: 'Tag',
            'origin.id': 'manual',
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
  if (session) tags_ = tags_.session(session)
  let tags = await tags_
  // calculate thisGroupMap, like
  //  {id0: [id0, id1, id2],id1: [id0, id1, id2],id2: [id0, id1, id2]}
  for (let tag of tags) {
    let thisid = tag.id
    let thatids = tag.relations.filter(
      _ => _.relation_id === groupRelation.id && _.origin.find(__ => __.id==='manual')
    ).map(_ => _.other_id)
    // group ids build from a single tag
    let fullids = [thisid, ...thatids]
    let merged = false
    let thisMatch
    for (let each of thisGroupMatching) {
      let {data} = each
      // test whether this is a new group
      let intersection = _.intersection(data, fullids)
      if (intersection.length) { // merge these two groups into one large group
        merged = true
        let __ = _.union(data, fullids)
        // make sure the final map is sorted
        // this will effect the order of relations for a tag
        each.data = __.sort()
        thisMatch = each
        break
      }
    }
    if (!merged) {
      let __ = {data: fullids}
      thisGroupMatching.push(__)
      thisMatch = __
    }
    thisGroupMap[thisid] = thisMatch
  }
  return {tags, thisGroupMap}
}
/* Calculate all api actions to add relations for tags in same group
for each tag
  force add all the relatoins within same group (thanks to the origin system)
  but filter deplicated addition operation
*/
async function getSingleGroupAdd ({groupRelation, session, thisid}) {
  let {tags, thisGroupMap} = await getGroupMap({groupRelation, session})
  let thisResult = {}
  let thisAddData = []
  let exists = []
  /* if thisid, this func is called in groupRelationTagOPs
       return relations of
        a tag => other tags in the same group
       is enough
     else, this func is called in turnOn
      we should return relations
        tags => other tags in the same group
  */
  if (thisid) tags = tags.filter(_ => thisGroupMap[_.id].data.includes(thisid))
  for (let tag of tags) {
    let thisid = tag.id
    // relations that already exists (and have this hook origin)
    let thatids = tag.relations.filter(_ =>
      _.relation_id === groupRelation.id && ((_.origin.find(__ => __.id === hook.uid)))
    ).map(_ => _.other_id)
    let fullids = thisGroupMap[thisid].data
    let thisRelations = []
    let thisExists
    // force add all relations (thanks to the origin features)
    for (let newid of fullids) {
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
/* delete all relations with origin id: hook.uid */
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
  {name: 'simular'},
  {name: 'translation'},
]}]

// this is a function generator, it return the real hook function with parameters
async function hookGenerator(parameters) {
  hook.runtimeData = {
    oldMap: new Map()
  }
  let groups = parameters.groups
  let relationIDs = await globals.Models.Relation.find({name: {$in: groups}})
  relationIDs = relationIDs.map(_ => _.id)
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
  /* run when +*- relations of a Tag */
  async function groupRelationTagOPs({operation, result, meta, origin, origin_flags, model, withs, data, field, entry, oldEntry, session}) {
    let doc = entry._doc
    if (!doc.relations) return
    origin = { id: hook.uid, hook: hook.uid }
    let thisRelationIDs, groups, final
    if (operation === "+" || operation === "*") { // add new relations for this tag
      thisRelationIDs = doc.relations.map(_ => _.relation_id)
      groups = _.intersection(thisRelationIDs, relationIDs)
      if (!groups.length) return // no groupRelations in the added relations, return
      let groupRelations = doc.relations.filter(_ => relationIDs.includes(_.relation_id))
      let r = { }
      for (let id of groups) {// add relations of tag => other tag in this groups
        let groupRelation = await globals.Models.Relation.findOne({id}).session(session)
        r[id] = await getSingleGroupAdd({groupRelation, session, thisid: entry.id})
      }
      let modified = await addGroupRelations(r)
      if (modified.data.length) {
        final = {operation:'+', data: [modified], meta, origin}
      } else {
        return []
      }
    } else if (operation === '-') { // delete relations from this tag
      // we should get presaved groupMap before this tag is deleted
      if (!hook.runtimeData.oldMap.has(session)) return []
      let groupResults = hook.runtimeData.oldMap.get(session)
      hook.runtimeData.oldMap.delete(session)
      let groups = Object.keys(groupResults)
      for (let id of groups) { // delete relations of tag => other tag in this group
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
  groupRelationTagOPs.preDelete = async ({operation, meta, origin, model, data, field, entry, session}) => {
    if (!field || field === 'relations') {
      let thisRelationIDs = entry._doc.relations.map(_ => _.relation_id)
      let groups = _.intersection(thisRelationIDs, relationIDs)
      if (!groups.length) {
        return
      }
      let r = { }
      for (let id of groups) {
        let groupRelation = await globals.Models.Relation.findOne({id}).session(session)
        if (!groupRelation) {
          throw Error(`inconsistant database, groupRelation ${id} has been deleted!`)
        }
        let {tags, thisGroupMap} = await getGroupMap({groupRelation, session})
        r[id] = {tags, oldGroupMap: thisGroupMap, groupRelation}
      }
      hook.runtimeData.oldMap.set(session, r)
    }
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
  priority: -10,
  parameters: {groups: [
    'simular',
    'translation',
  ]},
  hookGenerator,
  data,
  turnOn,
  turnOff
}
export default hook
