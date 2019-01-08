import mongoose from 'mongoose'
const {Schema} = mongoose

const User = {
  nestedKeys: [
    'username'
  ],
  schema: {
    username: { type: String },
    password: { type: String },
    active: { type: Boolean },
    group: { type: mongoose.Schema.Types.ObjectId, default: null },
    createTime: { type: Date, default: Date.now }
  }
}
const Metadata = {
  nestedKeys: 'all',
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
    format: { type: String, index: true },
  }
}
const Relation = {
  nestedKeys: 'all',
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
    symmetric: { type: Boolean, index: true },
  }
}

const Tag = {
  nestedKeys: 'all',
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
  }
}
const Catalogue = {
  nestedKeys: 'all',
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
  }
}

const Article = {
  nestedKeys: [
    'title',
    'abstract',
  ],
  schema: {
    title: { type: String, index: true },
    author: { type: String, index: true },
    editor: { type: String, index: true },
    abstract: { type: String, index: true },
    type: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
const Website = {
  nestedKeys: [
    'title',
    'url',
  ],
  schema: {
    title: { type: String, index: true },
    url: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
const File = {
  nestedKeys: [
    'path',
    'description',
  ],
  schema: {
    path: { type: String, index: true },
    description: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
const Book = {
  nestedKeys: [
    'title',
    'abstract',
  ],
  schema: {
    title: { type: String, index: true },
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
const Snippet = {
  nestedKeys: [
    'name',
    'language',
  ],
  schema: {
    name: { type: String, index: true },
    language: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
const Info = {
  nestedKeys: [
    'name',
  ],
  schema: {
    name: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
export default {
  User,
  Metadata, Catalogue, Tag, Relation,
  Article,
  Website,
  File,
  Book,
  Snippet,
  Info,
}
