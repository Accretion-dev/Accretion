async function gen(parameters) {
  let hookData = {}
  // test if the similar relation exists
  // protect similar relation from bing delete if this hook function is active
  async function init () {
    let result = globals.api({
      operation: "+",
      model: 'Relation',
      data:{
        name: 'translation'
      },
      origin:{ id:'translation-hook' }
    })
    hookData.translation = result.modelID
  }
  async function tagConstrain({operation, entry}) {
    console.log('this is just a wrapper, you should never see this')
  }

  relationConstrain.test = ({operation, entry, field, meta, origin, origin_flags}) => {
    if (field) return false
    let id = hookData.translation
    if (operation === '-' && entry.id === id) {
      throw Error('The translation hook is active, can not delete the `translation` relation')
    } else if (entry.id === id && operation === '*' && entry.name != 'translation') {
      throw Error('The translation hook is active, can not rename the `translation` relation')
    }
    return false
  }
  await init()
  async function translation ({operation, entry, old_sub_entry, new_sub_entry, meta, origin, origin_flags}) {
    // console.log({operation, entry, old_sub_entry, new_sub_entry})
    let {uuid} = parameters
    return []
  }
  translation.test = ({operation, entry, old_sub_entry, new_sub_entry, meta, origin, origin_flags}) => {
    if (operation === "+") {

    } else if (operation === '*') {

    } else if (operation === '-') {

    }
  }
  return {
    tags: translation,
    Relation: relationConstrain
  }
}

export default {
  uid: "translation",
  name: "translation",
  description: "When two tag have the 'translation' relation, they are the same tag, auto sync all tag addition and deletion",
  parameters: {},
  function: gen,
}
