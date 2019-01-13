import mongoose from 'mongoose'
const {Schema} = mongoose

const User = {
  schema: {
    username: { type: String },
    password: { type: String },
    active: { type: Boolean },
    group: { type: Schema.Types.ObjectId, default: null },
    createTime: { type: Date, default: Date.now }
  }
}
const Metadata = {
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
    format: { type: String, index: true },
  }
}
const Relation = {
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
    symmetric: { type: Boolean, index: true },
  }
}

const Tag = {
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
  }
}
const Catalogue = {
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
  }
}

const History = {
  schema: {
    time: { type: Date, default: Date.now },
    operation: { type: String, index: true },
    field: { type: String, index: true },
    model: { type: String, index: true},
    id: { type: Schema.Types.ObjectId },
    result: { type: Schema.Types.Mixed },
    data: { type: Schema.Types.Mixed },
    meta: { type: Schema.Types.Mixed },
  }
}

const Article = {
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
  schema: {
    title: { type: String, index: true },
    url: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
const File = {
  schema: {
    path: { type: String, index: true },
    description: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
const Book = {
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
  schema: {
    name: { type: String, index: true },
    language: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
const Info = {
  schema: {
    name: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}

const Config = {
  schema: {
    name: { type: String, index: true },
    value: { type: Schema.Types.Mixed }
  }
}
const UserConfig = {
  schema: {
    name: { type: String, index: true },
    value: { type: Schema.Types.Mixed }
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
  Config,
  UserConfig,
  History,
}
