import mongoose from 'mongoose'
import fs from 'fs'
import path from 'path'
import globals from "../globals"
globals.pluginsData = {}

let components = ["hook", 'task', 'searchTemplate', 'model', 'data']
let HookAction = {
  relations: [],
  metadatas: [],
  tags: [],
  catalogues: [],
  fathers: [],
  children: [],
}

function updateData (plugins) {
  let models = []
  let data = []
  for (let eachPlugin of plugins) {
    if (!eachPlugin.active) continue
    for (let each of eachPlugin.model) {
      models.push(each)
    }
    for (let each of eachPlugin.data) {
      if (!each.active) continue
      data.push(each.data)
    }
  }
  globals.pluginsData.model = models
  globals.pluginsData.data = data
}
async function updateHooks (plugins) {
  let initHookErrors = []
  for (let eachPlugin of plugins) {
    if (!eachPlugin.active) continue
    for (let eachHook of eachPlugin.hook) {
      if (!eachHook.active) continue
      let uid = eachHook.uid
      let parameters = Object.assign({}, eachHook.parameters, {uid})
      try {
        let thishook = await eachHook.function(parameters)
        for (let hooktype of Object.keys(thishook)) {
          if (!HookAction[hooktype]) HookAction[hooktype] = []
          HookAction[hooktype].push(thishook[hooktype])
        }
      } catch (error) {
        initHookErrors.push({plugin:eachPlugin.uid, hook: eachHook.uid, error: error.message})
      }
    }
    if (eachPlugin.task) { // for auto run task
      for (let eachTask of eachPlugin.task) {
      }
    }
  }
  globals.pluginsData.hook = HookAction
  return initHookErrors
}
async function initPlugins ({allActive}) {
  let pluginModel = globals.pluginModel
  let plugins = []
  let pluginNames = fs.readdirSync(__dirname)
  let pluginUIDs = []
  let componentUIDs = []
  // for each plugin
  for (let filename of pluginNames) {
    let pluginDir = path.join(__dirname, filename)
    if (!fs.statSync(pluginDir).isDirectory()) continue
    let pluginDict = require(pluginDir).default
    let uid = pluginDict.uid // uid for each plugin
    if (!uid) throw Error(`Plugin should have a uid! current is ${JSON.stringify(pluginDict,null,2)}`)
    if (pluginUIDs.includes(uid)) throw Error(`Deplicated uid for plugin: ${pluginDict}`)
    pluginUIDs.push(uid)

    let oldConfig = await pluginModel.findOne({uid})
    if (allActive) {
      Object.assign(pluginDict, {
        active: true
      })
    } else {
      if (oldConfig) {
        Object.assign(pluginDict, {
          active: oldConfig.active
        })
      } else {
        Object.assign(pluginDict, {
          active: false
        })
      }
    }
    let pluginDictModel = Object.assign({}, pluginDict)
    // for different component, e.g. model, hook, task, data
    for (let component of components) {
      let componentDir = path.join(pluginDir, component)
      // init component to []
      if (!pluginDict[component]) pluginDict[component] = []
      if (!pluginDictModel[component]) pluginDictModel[component] = []
      if (!fs.existsSync(componentDir)) continue
      fs.readdirSync(componentDir).forEach(subfilename => {
        let componentFile = path.join(componentDir, subfilename)
        let componentDict = require(componentFile).default
        // console.log(component, componentFile, componentDict)
        componentDict.origin = pluginDict.name
        if (!componentDict.uid) throw Error(`all component should have a uid! current is ${JSON.stringify(pluginDict,null,2)}`)
        if (component !== 'model') { // for models, the uid of component itself should be unique
          componentDict.uid = `${uid}-${componentDict.uid}`
        }
        if (componentUIDs.includes(componentDict.uid)) throw Error(`Deplicated uid for component ${componentDict.uid} in plugin ${JSON.stringify(pluginDict,null,2)}`)
        componentUIDs.push(componentDict.uid)
        let oldSubConfig = oldConfig && oldConfig[component].find(_ => _.uid === componentDict.uid)
        if (oldSubConfig) {
          // use the saved active and parameters
          Object.assign(componentDict, {
            active: oldSubConfig.active,
            parameters: oldSubConfig.parameters,
          })
        } else {
          // use the default active and parameters
          Object.assign(componentDict, {
            active: false
          })
        }
        pluginDict[component].push(componentDict)
        let withoutFunction = Object.assign({}, componentDict)
        delete withoutFunction.function
        pluginDictModel[component].push(withoutFunction)
      })
    }
    plugins.push(pluginDict)
    await pluginModel.updateOne(
      {uid},
      {$set: pluginDictModel},
      {upsert: true}
    )
  }
  // console.log('allPlugins:', await pluginModel.find({}).toArray())
  globals.plugins = plugins
  console.log('plugins:', plugins)
  let initHookErrors = await updateHooks(plugins)
  console.log('pluginsData:', globals.pluginsData)
  if (initHookErrors.length) {
    throw Error(`init hook function error: ${JSON.stringify(initHookErrors,null,2)}`)
  }
  updateData(plugins)
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



export default {initPlugins}
