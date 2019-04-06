import globals from "../../../globals"
import _ from 'lodash'

async function addAllAncestorTags () {
  let tags = await globals.getAllAncestors({model: 'Tag'})
  let tagIDs = Object.keys(tags).map(_ => Number(_))
  let datas = []
  for (let model of globals.WithsDict.WithTag) {
    let data = {
      model,
      field: 'tags',
      data: []
    }
    let roots = await globals.Models[model].aggregate([
      {$match: {
        'tags.tag_id': { $in: tagIDs }
      }},
      {$project: {id: 1, tags: 1}}
    ])
    for (let root of roots) {
      let thistagdata = []
      for (let tag of root.tags) {
        if (tags[tag.tag_id]) {
          for (let add of tags[tag.tag_id].ancestors) {
            thistagdata.push({
              tag_id: add,
              origin: [{
                id: `${hook.uid}-${tag.id}`,
                hook: `${hook.uid}`,
                origin_id: tag.tag_id,
                origin_nam: tag.name,
              }]
            })
          }
        }
      }
      data.data.push({
        id: root.id,
        tags:thistagdata,
      })
    }
    if (data.data.length) {
      datas.push(data)
    }
  }
  return datas
}
async function delAllAncestorTags () {
  let datas = []
  for (let model of globals.WithsDict.WithTag) {
    let data = {
      model,
      field: 'tags',
      data: []
    }
    let roots = await globals.Models[model].aggregate([
      {$match: {
        'tags.origin.hook': hook.uid
      }},
      {$project: {id: 1, tags: 1}}
    ])
    for (let root of roots) {
      let thistagdata = []
      for (let tag of root.tags) {
        let thisorigins = tag.origin.filter(_ => _.hook === hook.uid)
        if (thisorigins.length) {
          thistagdata.push({
            id: tag.id,
            origin: thisorigins
          })
        }
      }
      data.data.push({
        id: root.id,
        tags:thistagdata
      })
    }
    datas.push(data)
  }
  return datas
}

async function turnOn ({meta}) {
  // console.log(`turn on ${hook.uid}`)
  let toAdd = await addAllAncestorTags()
  let result = await globals.bulkOP({operation:"+", data: toAdd, meta})
  return result
}
async function turnOff ({meta}) {
  // console.log(`turn off ${hook.uid}`)
  let toDel = await delAllAncestorTags()
  let result = await globals.bulkOP({operation:"-", data: toDel, meta})
  return result
}

// this is a function generator, it return the real hook function with parameters
async function hookGenerator(parameters) {
  // test
  // this function will be injected into the taglikeAPI
  async function ancestorTags({name, operation, meta, origin, origin_flags, entry, old_sub_entry, new_sub_entry, session, full_delete}) {
    if (operation === "+" || operation ===  '-') {
      if (!origin_flags.origin.some(_ => _.id === 'manual')) return []
      if (operation === '-'&&full_delete) return []
    } else if (operation === "*") {
      if (!changeTaglike) return []
      // old_sub_entry can be changed, it must only have 'manual' origin
    }

    let ancestors, sub_tag_id, this_sub_entry
    if (operation === "*" || operation === '-') {
      this_sub_entry = old_sub_entry
    } else { // operation === +
      if (origin_flags.entry) {
        this_sub_entry = new_sub_entry
      } else {
        this_sub_entry = old_sub_entry
      }
    }
    sub_tag_id = this_sub_entry.id
    ancestors = await globals.getAncestors({model:'Tag', query:{id: this_sub_entry.tag_id}})

    if (operation === '*') operation = '+'

    let entry_model = entry.schema.options.collection
    let result = [{operation, data: [
      {model: entry_model, field:'tags', data: [{
        id: entry.id,
        tags: ancestors.map(__ => {
          if (operation === "+") {
            return {
              tag_id: __, origin:[{
                id: `${hook.uid}-${sub_tag_id}`,
                hook: `${hook.uid}`,
                origin_id: this_sub_entry.tag_id,
                origin_name: this_sub_entry.tag_name,
              }]
            }
          } else {
            return {
              __query__:{tag_id: __}, origin:[{
                id: `${hook.uid}-${sub_tag_id}`,
                hook: `${hook.uid}`,
                origin_id: this_sub_entry.tag_id,
                origin_name: this_sub_entry.tag_name,
              }]
            }
          }
        })
      }]}
    ]}]
    return result
  }
  async function tagFamilyChange({name, operation, meta, origin, origin_flags, entry, old_sub_entry, new_sub_entry, session, full_delete}) {
    let entry_model = entry.schema.options.collection
    if (entry_model !== 'Tag') return []
    if (!origin_flags.origin.some(_ => _.id === 'manual')) return []
    let this_sub_entry = operation==='+' ? new_sub_entry : old_sub_entry
    let father, child
    if (name === 'fathers') {
      father = {id: this_sub_entry.id}
      child = {id: entry.id}
    } else if (name === 'children') {
      father = {id: entry.id}
      child = {id: this_sub_entry.id}
    } else {
      throw Error('should not be here')
    }
    let offsprings = await globals.getOffsprings({model:'Tag', query:child})
    let ancestors = await globals.getAncestors({model:'Tag', query:father})
    ancestors.push(father.id)
    offsprings.push(child.id)
    result = []
    for (let model of globals.WithsDict.WithTag) {
      let modelresult = {
        model, field:'tags', data:[]
      }
      // add or delete a new tag for all the offsprings of father
      for (let offspring of offsprings) {
        let relatedEntries = await globals.Models[model].aggregate([
          {$match: {
            tags: {
              $elemMatch: {
                tag_id: offspring,
                'origin.id': 'manual',
              }
            },
          }},
          {$project: {id: 1, tags: 1}}
        ])
        let datas = relatedEntries.map(thisentry => {
          let that_sub_entry = thisentry.tags.find(_ => _.tag_id === offspring)
          return {
            id: thisentry.id,
            tags: operation === '+'
                  ?
                  ancestors.map(__ => ({
                    tag_id: __,
                    origin:[{
                      id: `${hook.uid}-${that_sub_entry.id}`,
                      hook: `${hook.uid}`,
                      origin_id: offspring,
                      changeFamily: true,
                  }]}))
                  :
                  ancestors.map(__ => ({
                    __query__: {tag_id: __},
                    origin:[{
                      id: `${hook.uid}-${that_sub_entry.id}`,
                      hook: `${hook.uid}`,
                      origin_id: offspring,
                      changeFamily: true,
                  }]}))
          }
        })
        modelresult.data = [...modelresult.data, ...datas]
      }
      if (modelresult.data.length) {
        result.push(modelresult)
      }
    }
    return [{operation, data: result}]
  }
  let result = {
    tags: ancestorTags,
    fathers: tagFamilyChange,
    children: tagFamilyChange,
  }
  return result
}
let hook = {
  uid: "ancestorTags",
  name: "ancestorTags",
  description: "When a tag is added for a model, automatically add all its ancestor as tag",
  priority: 0,
  parameters: {},
  hookGenerator,
  turnOn,
  turnOff
}
export default hook
