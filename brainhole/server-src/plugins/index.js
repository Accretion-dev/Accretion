import mongoose from 'mongoose'
import fs from 'fs'
import _ from 'lodash'
import path from 'path'
import globals from "../globals"
globals.pluginsData = {}

let components = ["hook", 'task', 'model', 'data']

async function bulkAdd({data, componentUID, meta, type}) {
  let query = ({model, data}) => {
    let required = globals.getRequire(model)
    let keys = []
    for (let key of required) {
      if (data[key]) keys.push(key)
    }
    data = _.pick(data, keys)
    return data
  }
  let result = await globals.bulkOP({
    operation: '+', data, query,
    origin:{
      id: `${componentUID}-${type}`,
      hook: componentUID,
      type,
    },
    meta,
  })
  return result
}
async function bulkDel({componentUID, meta, rawdata, type}) {
  let result
  let origin = {id: `${componentUID}-${type}`}
  let flattenData = globals.flattenData(rawdata)
  let models = new Set(flattenData.map(_ => _.model))
  let data = []

  for (let model of models) {
    let Model = globals.Models[model]
    let ids = await Model.aggregate([
      {
        $match: {
          'origin.id': origin.id,
        },
      },
      {
        $project: {
          id: 1
        }
      }
    ])
    if (ids.length) data.push({model, data:ids})
  }
  result = await globals.bulkOP({operation: '-', data, meta, origin})
  return result
}
async function pluginAPI({operation, uid, component, componentUID}) {
  let plugin = globals.plugins.find(_ => _.uid === uid)
  if (!plugin) throw Error(`can not find plugin of uid: ${uid}`)
  let result = {}
  if (component && componentUID) { // operation on plugin component
    if (!plugin[component]) throw Error(`component ${component} not exist in plugin ${uid}`)
    let thiscomponent = plugin[component].find(_ => _.uid === componentUID)
    if (!thiscomponent) throw Error(`component entry uid:${componentUID} not exist in component ${component} in plugin ${uid}`)
    let history = new globals.Models.History({
      operation, data:componentUID,
    })
    history = await history.save()
    // if meta.hookAction is true, api will not process any hook
    // useful when what to make a 'clean' api operation
    let meta = {history_stack: [{id: history._id, type: 'pluginAPI'}], noHook: true}
    if (component === 'hook') {
      let hook
      if (operation === 'on') {
        try {
          thiscomponent.active = true
          if (thiscomponent.data) {
            result.hookData = await bulkAdd({data: thiscomponent.data, componentUID, meta, type:'hook-data'})
          }
          hook = globals.pluginsData.hook
          let updateHookErrors = await updateHooks(globals.plugins)
          if (updateHookErrors.length) {
            throw Error(`update hook function error: ${JSON.stringify(updateHookErrors,null,2)}`)
          }
          if (thiscomponent.turnOn) {
            result.initData = await thiscomponent.turnOn({meta})
            let total = result.initData.length
            let field = _.sum(result.initData.map(_ => _.goodWiths[_.field].total))
            let fieldEntry = _.sum(result.initData.map(_ => _.goodWiths[_.field].entry))
            let fieldOrigin = _.sum(result.initData.map(_ => _.goodWiths[_.field].origin))
            result.statistic = {total, field, fieldEntry, fieldOrigin}
          }
          await globals.Models.Plugins.findOneAndUpdate(
            {uid},
            {$set: plugin},
          )
        } catch (e) {
          thiscomponent.active = false
          globals.pluginsData.hook = hook
          throw e
        }
      } else if (operation === 'off') {
        try {
          thiscomponent.active = false
          hook = globals.pluginsData.hook
          let updateHookErrors = await updateHooks(globals.plugins)
          if (updateHookErrors.length) {
            throw Error(`update hook function error: ${JSON.stringify(updateHookErrors,null,2)}`)
          }
          if (thiscomponent.turnOff) {
            result.initData = await thiscomponent.turnOff({meta})
            let total = result.initData.length
            let field = _.sum(result.initData.map(_ => _.goodWiths[_.field].total))
            let fieldEntry = _.sum(result.initData.map(_ => _.goodWiths[_.field].entry))
            let fieldOrigin = _.sum(result.initData.map(_ => _.goodWiths[_.field].origin))
            result.statistic = {total, field, fieldEntry, fieldOrigin}
          }
          if (thiscomponent.data) {
            result.hookData = await bulkDel({componentUID, meta, rawdata: thiscomponent.data, type: 'hook-data'})
          }
          await globals.Models.Plugins.findOneAndUpdate(
            {uid},
            {$set: plugin},
          )
        } catch (e) {
          thiscomponent.active = true
          globals.pluginsData.hook = hook
          throw e
        }
      } else if (operation === 'count') {
        result.count = await thiscomponent.count()
      }
    } else if (component === 'task') {
      if (operation === 'on') {
      } else if (operation === 'off') {
      }
    } else if (component === 'model') {
      // finish this when we have UI
      // need restart after model change
      if (operation === 'on') {
      } else if (operation === 'off') {
      }
    } else if (component === 'data') {
      if (operation === 'on') {
        result.data = await bulkAdd({data: thiscomponent.data, componentUID, meta, type: 'data'})
      } else if (operation === 'off') {
        result.data = await bulkDel({componentUID, meta, rawdata: thiscomponent.data, type: 'data'})
      }
    }
    history.query = true
    await globals.Models.History.findOneAndUpdate(
      {_id:history._id},
      {$set: history},
    )
    result.component = thiscomponent
    return result
  } else { // operation on plugin itself
    if (operation === 'on') {
      plugin.active = true
      if (plugin.turnOn) await plugin.turnOn()
      await globals.Models.Plugins.findOneAndUpdate(
        {uid},
        {$set: plugin},
      )
    } else if (operation === 'off') {
      // check if all its component is off
      for (let key of components) {
        for (let each of plugin[key]) {
          if (each.active) {
            throw Error(`Can not turn off plugin ${uid}, its ${key} component uid:${each.uid} is still open, close the components first!`)
          }
        }
      }
      plugin.active = false
      if (plugin.turnOn) await plugin.turnOff()
      await globals.Models.Plugins.findOneAndUpdate(
        {uid},
        {$set: plugin},
      )
    }
    return plugin
  }
}
globals.pluginAPI = pluginAPI
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
}
async function updateHooks (plugins) {
  let HookAction = {
    relations: [],
    metadatas: [],
    tags: [],
    catalogues: [],
    fathers: [],
    children: [],
  }
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
  let pluginModel = globals.Models.Plugins
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
    if (oldConfig) oldConfig = oldConfig._doc
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
        if (component !== 'model') { // for models, the uid of component itself should be unique
          if (!componentDict.name) throw Error(`all component should have a name! current is ${JSON.stringify(componentDict,null,2)}`)
          componentDict.uid = `${uid}[${component}]${componentDict.name}`
        }
        if (componentUIDs.includes(componentDict.uid)) throw Error(`Deplicated uid for component ${componentDict.uid} in plugin ${JSON.stringify(pluginDict,null,2)}`)
        componentUIDs.push(componentDict.uid)
        let oldSubConfig = oldConfig && oldConfig[component] && oldConfig[component].find(_ => _.uid === componentDict.uid)
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
    await pluginModel.findOneAndUpdate(
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

export default {initPlugins, components, pluginAPI}
