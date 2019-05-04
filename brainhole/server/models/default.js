import mongoose from 'mongoose'
import __ from '../plugins'
const {components} = __
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
const History = {
  schema: {
    time: { type: Date, default: Date.now },
    operation: { type: String },
    modelID: { type: Number },
    model: { type: String },
    field: { type: String },
    query: { type: Schema.Types.Mixed },
    data: { type: Schema.Types.Mixed },
    simple:  { type: Schema.Types.Mixed },
    withs:  { type: Schema.Types.Mixed },
    meta: { type: Schema.Types.Mixed },
    hookActions: { type: Schema.Types.Mixed },
    origin: { type: Schema.Types.Mixed },
    origin_flags: { type: Schema.Types.Mixed },
  }
}
const Plugins = {
  schema: {
    uid: { type: String },
    name: { type: String },
    author: { type: String },
    author_email: { type: String },
    description: { type: String },
  }
}
components.map(_ => Plugins.schema[_] = [{type: mongoose.Schema.Types.Mixed}])

// four import meta info for all other model
const Metadata = {
  searchKeys: [{name:1}],
  schema: {
    name: { type: String, required: true },
    type: { type: String },
    format: { type: String },
  }
}
const Relation = {
  searchKeys: [{name:1}, {reverse_name:1}],
  schema: {
    name: { type: String, required: true },
    reverse_name: { type: String },
    type: { type: String },
    onlyFor: [{ type: String }],
    symmetric: { type: Boolean },
    hook: { type: String },
  }
}
const Tag = {
  searchKeys: [{name:1}],
  schema: {
    name: { type: String, text: true, required: true },
    type: { type: String },
    description: { type: String },
    display_name: { type: String },
  }
}
const Catalogue = {
  searchKeys: [{name:1}],
  projects: {
    simple: {name: 1, type: 1, comment: 1}
  },
  schema: {
    name: { type: String, required: true },
    type: { type: String },
    description: { type: String },
  }
}

// top models
//   have metadatas, relations, tags, catalogues, flags, fathers, children
const Article = {
  searchKeys: [{title:1}, {author:1}, {editor:1}, {abstract:1}],
  projects: {
    simple: {name: 1, type: 1, comment: 1},
  },
  schema: {
    title: { type: String, required: true },
    author: { type: String, },
    editor: { type: String, },
    abstract: { type: String, },
    type: { type: String },
    content: { type: String },
  }
}
const Website = {
  searchKeys: [{title:1}, {url:1}],
  projects: {
    simple: {title: 1, url: 1, comment: 1},
  },
  schema: {
    title: { type: String },
    url: { type: String, required: true },
  }
}
const File = {
  searchKeys: [{name:1}, {path:1}],
  projects: {
    simple: {name: 1, path: 1, comment: 1},
  },
  schema: {
    name: { type: String, required: true },
    path: { type: String, required: true },
    content: { type: String },
  }
}

// for light cone
//   need more details
//const Event = { }
//const EventSpends = { }
//const EventPlans = { }

// other models
const Config = {
  schema: {
    name: { type: String, required: true },
    value: { type: Schema.Types.Mixed }
  }
}
const UserConfig = {
  schema: {
    name: { type: String, required: true },
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
  IDs, User, History, Plugins,
  Metadata, Catalogue, Tag, Relation,
  Article, Website, File,
  Config, UserConfig,
  Editing, Workspace,
}
