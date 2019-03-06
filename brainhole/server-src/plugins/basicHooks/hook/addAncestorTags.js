// this is a function generator, it return the real hook function with parameters
function gen(parameters) {
  // this function will be injected into the taglikeAPI
  async function addAncestorTags({operation, entry, }) {
    let {uuid} = parameters
    if (operation === "+") {

    } else if (operation === '*') {

    } else if (operation === '-') {

    }
    return {
      add: {

      },
      del: {

      }
    }
  }
  return {
    tags: addAncestorTags
  }
}
export default {
  uid: "addAncestorTags",
  name: "addAncestorTags",
  description: "When a tag is added for a model, automatically add all its ancestor as tag",
  parameters: {},
  function: gen,
}
