import globals from "../../../globals"
import _ from 'lodash'

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

    let thisResult = result[group] = {}
    thisResult.relation = groupRelation
    let thisGroupMatching = []
    let thisGroupMap = {}
    let thisAddData = []
    let tags = await globals.Models.Tag.aggregate([
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
    for (let tag of tags) {
      let thisid = tag.id
      let thatids = tag.relations.filter(_ => _.relation_id === groupRelation.id).map(_ => _.other_id)
      let fullids = thisGroupMap[thisid].data
      let newids = _.difference(fullids, [thisid, ...thatids])
      let thisRelations = []
      let thisExists
      for (let oldid of thatids) {
        if (oldid > thisid) {
          thisExists = `${thisid}-${oldid}`
        } else {
          thisExists = `${oldid}-${thisid}`
        }
        if (!exists.includes(thisExists)) exists.push(thisExists)
      }
      for (let newid of newids) {
        if (newid > thisid) {
          thisExists = `${thisid}-${newid}`
          if (exists.includes(thisExists)) continue
          thisRelations.push({
            relation_id: groupRelation.id,
            from_id: newid,
          })
          exists.push(thisExists)
        } else {
          thisExists = `${newid}-${thisid}`
          if (exists.includes(thisExists)) continue
          thisRelations.push({
            relation_id: groupRelation.id,
            to_id: newid,
          })
          exists.push(thisExists)
        }
      }
      thisAddData.push({
        id: thisid,
        relations:thisRelations
      })
    }
    thisAddData = thisAddData.filter(_ => _.relations.length>0)
    result[group].data = thisAddData
  }
  return result
}
async function addAllGroupRelations () {
  let newdata = await getGroupsAdd()
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
  let toAdd = await addAllGroupRelations()
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
          throw Error(`The hook:${hook.uid} is active, you can not delete these relations:${tags}, but you are trying to delete ${entry._doc}`)
        }
      }
    }
  }
  async function groupRelationTagOPs({operation, result, meta, origi, origin_flagsn, model, withs, data, field, entry}) {
    let {uuid} = parameters
    if (operation === "+") {

    } else if (operation === '*') {

    } else if (operation === '-') {

    }
    return []
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
