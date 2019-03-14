async function gen(parameters) {
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
  uid: "addTranslationTags",
  name: "addTranslationTags",
  description: "When a tag is added for a model, automatically add all other tags that have the 'translation' relation with it",
  parameters: {},
  function: gen,
  data: [
    {
      model: 'Relation',
      data: [
        {
          name: 'CN2EN',
          symmetric: false,
        }
      ]
    }
  ]
}
