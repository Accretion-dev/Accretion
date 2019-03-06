function gen(parameters) {
  async function addSimularTags (parameters) {
    let {uuid} = parameters
    return {
      add: {

      },
      del: {

      }
    }
  }
  return {
    tags: addSimularTags
  }
}

export default {
  uid: "addSimularTags",
  name: "addSimularTags",
  description: "When a tag is added for a model, automatically add all other tags that have the 'simular' relation with it",
  parameters: {},
  function: gen,
}
