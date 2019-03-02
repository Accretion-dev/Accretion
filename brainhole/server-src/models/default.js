import mongoose from 'mongoose'
const {Schema} = mongoose

// most search can be done by searchKey
// but there are possible duplicated entry with same searchKey
// throw error in this case

// internal use
const IDs = {
  schema: {
    name: { type: String, index: true },
    count: { type: Number }
  }
}
const User = {
  schema: {
    username: { type: String },
    password: { type: String },
    active: { type: Boolean },
    group: { type: String, default: null },
    createTime: { type: Date, default: Date.now }
  }
}

// four import meta info for all other model
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
    onlyFor: [{ type: String }],
    symmetric: { type: Boolean, index: true },
    hook: { type: String },
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
  projects: {
    simple: {name: 1, type: 1, comment: 1}
  },
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
    description: { type: String },
  }
}

// top models
//   have metadatas, relations, tags, catalogues, flags, fathers, children
const Article = {
  projects: {
    simple: {name: 1, type: 1, comment: 1},
    nobulk: {content: 0},
  },
  schema: {
    title: { type: String, index: true, required: true },
    author: { type: String, index: true },
    editor: { type: String, index: true },
    abstract: { type: String, index: true },
    type: { type: String, index: true },
    content: { type: String },
  }
}
const Website = {
  projects: {
    simple: {title: 1, url: 1, comment: 1},
  },
  schema: {
    title: { type: String, index: true },
    url: { type: String, index: true, required: true },
  }
}
const File = {
  projects: {
    simple: {name: 1, path: 1, comment: 1},
  },
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
const Snippet = {
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
const Info = {
  projects: {
    simple: {name: 1, type: 1, comment: 1},
    nobulk: {content: 0},
  },
  schema: {
    name: { type: String, index: true, required: true },
    type: { type: String, index: true },
    content: { type: String },
  }
}

// for light cone
//   need more details
//const Event = { }
//const EventSpends = { }
//const EventPlans = { }

// other models
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
    other_result: { type: Schema.Types.Mixed },
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

// for frontend
const Editing = {
  schema: {
    id: { type: Number },
    model: { type: String },
    name: { type: String },
    path: { type: String },

    createdAt: { type: Date },
    updatedAt: { type: Date },
    editedAt: { type: Date },
    editedIn: { type: String },

    configs: {type: Schema.Types.Mixed }
  }
}
const Workspace = {
  schema: {
    id: { type: Number },
    name: { type: String },
    createdAt: { type: Date },
    updatedAt: { type: Date },
    catalogueTree: { type: Schema.Types.Mixed },
    activeTab: { type: Schema.Types.Mixed },
    tabs: [{ type: Schema.Types.Mixed }],
    activeNavTab: { type: Schema.Types.Mixed },
    navTabs: [{ type: Schema.Types.Mixed }],

    configs: {type: Schema.Types.Mixed },
  }
}

export default {
  IDs, User,
  Metadata, Catalogue, Tag, Relation,
  Article, Website, File, Book, Snippet, Info,
  History, Config, UserConfig,
  Editing, Workspace,
}
