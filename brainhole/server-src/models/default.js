import mongoose from 'mongoose'
const {Schema} = mongoose

// most search can be done by searchKey
// but there are possible duplicated entry with same searchKey
// throw error in this case

const User = {
  schema: {
    username: { type: String },
    password: { type: String },
    active: { type: Boolean },
    group: { type: String, default: null },
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
    reverse_name: { type: String, index: true },
    type: { type: String, index: true },
    symmetric: { type: Boolean, index: true },
  }
}

const Tag = {
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
    description: { type: String },
    display_name: { type: String },
  }
}
const Catalogue = {
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
    description: { type: String },
  }
}

const Through = {
  schema: {
    path: { type: String, index: true },
    path_id: { type: Number, index: true },
    model: { type: String, index: true },
    model_id: { type: Number, index: true },
  }
}

const History = {
  schema: {
    time: { type: Date, default: Date.now },
    operation: { type: String, index: true },
    modelID: { type: Number, index: true},
    model: { type: String, index: true},
    field: { type: String, index: true },
    query: { type: Schema.Types.Mixed },
    data: { type: Schema.Types.Mixed },
    result: { type: Schema.Types.Mixed },
    simple:  { type: Schema.Types.Mixed },
    withs:  { type: Schema.Types.Mixed },
    meta: { type: Schema.Types.Mixed },
    through: { type: Schema.Types.Mixed },
  }
}

const Article = {
  schema: {
    title: { type: String, index: true, required: true },
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
    url: { type: String, index: true, required: true },
    bulk: {
      content: { type: String },
    }
  }
}
const File = {
  schema: {
    name: { type: String, index: true, required: true },
    path: { type: String, index: true, required: true },
    description: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
const Book = {
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
const Snippet = {
  schema: {
    name: { type: String, index: true, required: true },
    language: { type: String, index: true },
    bulk: {
      content: { type: String },
    }
  }
}
const Info = {
  schema: {
    name: { type: String, index: true, required: true },
    bulk: {
      content: { type: String },
    }
  }
}

const Config = {
  schema: {
    name: { type: String, index: true, required: true },
    value: { type: Schema.Types.Mixed }
  }
}
const UserConfig = {
  schema: {
    name: { type: String, index: true, required: true },
    value: { type: Schema.Types.Mixed }
  }
}

const IDs = {
  schema: {
    name: { type: String, index: true },
    count: { type: Number }
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
  IDs,
  Through,
}
