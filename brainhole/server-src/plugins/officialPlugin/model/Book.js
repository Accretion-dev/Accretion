export default {
  uid: 'Book',
  projects: {
    simple: {title: 1, author: 1, type: 1, comment: 1},
  },
  schema: {
    title: { type: String, index: true, required: true },
    author: { type: String, index: true },
    editor: { type: String, index: true },
    abstract: { type: String, index: true },
    type: { type: String, index: true },
    doi: { type: String, index: true },
    timePublic: { type: Date, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
