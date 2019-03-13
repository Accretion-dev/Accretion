export default {
  uid: 'Snippet',
  description: 'code snippets',
  projects: {
    simple: {name: 1, type: 1, comment: 1},
    nobulk: {content: 0},
  },
  schema: {
    name: { type: String, index: true, required: true },
    language: { type: String, index: true },
    content: { type: String },
  }
}
