function gen(parameters) {
  async function syncMeta ({operation, entry, old_sub_entry, new_sub_entry}) {
    // console.log({operation, entry, old_sub_entry, new_sub_entry})
    let {uuid} = parameters
    return {
      add: {

      },
      del: {

      }
    }
  }
  return {
    relations: syncMeta
  }
}

export default {
  uid: "syncMeta",
  name: "syncMeta",
  description: "When two model have the 'similar' relation, automatically sync their metadatas, catalogue and tags",
  parameters: {},
  function: gen,
}
