async function turnOn () {
  console.log(`turn on ${hook.uid}`)
}
async function turnOff () {
  console.log(`turn off ${hook.uid}`)
}
  
// this is a function generator, it return the real hook function with parameters
async function gen(parameters) {
  // test
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
  uid: "addAncestorTags",
  name: "addAncestorTags",
  description: "When a tag is added for a model, automatically add all its ancestor as tag",
  parameters: {},
  function: gen,
  turnOn,
  turnOff
}
export default hook
