import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import globals from "../globals"

let components = ["hook", 'task', 'searchTemplate', 'model', 'data']

async function initPlugins () {
  let pluginModel = mongoose.connection.db.collection('Plugins')
  let plugins = []
  let pluginNames = fs.readdirSync(__dirname)
  let pluginUIDs = []
  let componentUIDs = []
  for (let filename of pluginNames) {
    let pluginDir = path.join(__dirname, filename)
    if (!fs.statSync(pluginDir).isDirectory()) continue
    let pluginDict = require(pluginDir).default
    let uid = pluginDict.uid
    if (!uid) throw Error(`Plugin should have a uid! current is ${JSON.stringify(pluginDict,null,2)}`)
    if (pluginUIDs.includes(uid)) throw Error(`Deplicated uid for plugin: ${pluginDict}`)
    pluginUIDs.push(uid)
    let oldConfig = await pluginModel.findOne({uid})
    if (oldConfig) {
      Object.assign(pluginDict, {
        active: oldConfig.active
      })
    } else {
      Object.assign(pluginDict, {
        active: false
      })
    }
    for (let component of components) {
      let componentDir = path.join(pluginDir, component)
      if (!pluginDict[component]) pluginDict[component] = []
      if (!fs.existsSync(componentDir)) continue
      fs.readdirSync(componentDir).forEach(subfilename => {
        let componentFile = path.join(componentDir, subfilename)
        let componentDict = require(componentFile).default
        componentDict.origin = pluginDict.name
        if (!componentDict.uid) throw Error(`all component should have a uid! current is ${JSON.stringify(pluginDict,null,2)}`)
        componentDict.uid = `${uid}-${componentDict.uid}`
        if (componentUIDs.includes(componentDict.uid)) throw Error(`Deplicated uid for component ${componentDict.uid} in plugin ${JSON.stringify(pluginDict,null,2)}`)
        componentUIDs.push(uid)
        let oldSubConfig
        if (oldSubConfig) {
          let oldSubConfig = pluginUIDs[component].find(_ => _.uid === componentDict.uid)
        }
        if (oldSubConfig) {
          Object.assign(componentDict, {
            active: oldSubConfig.active
          })
        } else {
          Object.assign(componentDict, {
            active: false
          })
        }
        pluginDict[component].push(componentDict)
      })
    }
    plugins.push(pluginDict)
    await pluginModel.updateOne(
      {uid},
      {$set: pluginDict},
      {upsert: true}
    )
  }
  globals.plugins = plugins
  return plugins
}

// functions about hooks and tasks
/* design of task hook
  input: filter
*/

/* design of hook functions
  Hooks record all hook function, they are called in the xxxAPI with the corresponding operation
  each function return a dict like:
  {
    add: {
      relations: [],
      metadatas: [],
      tags: [],
      catalogues: [],
      fathers: [],
      children: [],
    },
    del: {
      relations: [],
      metadatas: [],
      tags: [],
      catalogues: [],
      fathers: [],
      children: [],
    }
  }

*/
let Hooks = []
let HookAction = {
  relations: {
    '+':[],
    '-':[],
    '*':[],
  },
  metadatas: {
    '+':[],
    '-':[],
    '*':[],
  },
  tags: {
    '+':[],
    '-':[],
    '*':[],
  },
  catalogues: {
    '+':[],
    '-':[],
    '*':[],
  },
  fathers: {
    '+':[],
    '-':[],
    '*':[],
  },
  children: {
    '+':[],
    '-':[],
    '*':[],
  },
}

// several official hooks
function fmailyHook (parameters) {

}

async function updateHooks () {
  let hook_models = await mongoose.models.Hook.find({})
  hook_models = hook_models.filter(_ => _.active)
  for (let hook_model of hook_models) {
    let uid = hook_model.uid
    let hook = Hooks.find(_ => _.uid === uid)
    if (!hook) continue // in case of not consistent data base
    for (let taglikes of Object.keys(HookAction)) {

    }
  }

}

export default {initPlugins}
