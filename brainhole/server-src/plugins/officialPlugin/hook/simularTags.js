import globals from "../../../globals"

async function testDatabaseConsistent () {
  let simular = await globals.Models.Relation.find({name: 'simular'})
  if (simular.length !== 1) throw Error(`if hook:${hook.uid} is active, we should got only one 'simular' relations, current query:${simular}`)
  return simular[0]
}
async function getTagWithRelation (relation) {
  let tags = await globals.Models.Tag.aggregate([
    {
      $match: {
        'relations.relation_id': relations.id,
        'relations.other_model': 'Tag',
      }
    },
    {
      $project: {
        id: 1,
        name: 1
      }
    }
  ])
  let simularTagMap = { }
  for (let tag of tags) {
    let thisGoodRelations = tag.relations.filter(_ => _.relation_id === relation.id)
    simularTagMap[tag.id] = thisGoodRelations.map(_ => _.other_id)
  }
  return {tags, simularTagMap}
}
async function turnOn () {
  console.log(`turn on ${hook.uid}`)
  let simular = await testDatabaseConsistent()
}
async function turnOff () {
  let simular = await testDatabaseConsistent()
  console.log(`turn off ${hook.uid}`)
}
let data = [{
  model: 'Relation',
  data: [
    {name: 'simular'}
  ]
}]

// this is a function generator, it return the real hook function with parameters
async function gen(parameters) {
  let hookData = {}
  hookData.simular = await testDatabaseConsistent()
  // this function will be injected into the taglikeAPI
  async function addAncestorTags({operation, entry, old_sub_entry, new_sub_entry, meta, origin}) {
    let {uuid} = parameters
    if (operation === "+") {

    } else if (operation === '*') {

    } else if (operation === '-') {

    }
    return []
  }
  return {
    tags: addAncestorTags
  }
}
let hook = {
  uid: "simularTags",
  name: "simularTags",
  description: "when a tag is added, add its simular tags",
  parameters: {},
  function: gen,
  data,
  turnOn,
  turnOff
}
export default hook
