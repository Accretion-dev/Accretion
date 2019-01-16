import mongoose from 'mongoose'
import fillDemo from './fillDemo'
import __ from './models'
const {Models, api, Withs} = __
const consola = require('consola')
const User = Models.User

async function initIDs () {
  let names = Object.keys(Models)
  for (let name of names) {
    let good = await Models.IDs.findOne({name})
    if (!good) {
      await Models.IDs.insertMany([{name, count: 1}])
    }
  }
  let models = Object.keys(Withs)
  for (let name of models) {
    for (let withname of Withs[name]) {
      if (['flags'].includes(withname)) continue
      let good = await Models.IDs.findOne({name: `${name}-${withname}`})
      if (!good) {
        await Models.IDs.insertMany([{name: `${name}-${withname}`, count: 1}])
      }
    }
  }
}

async function initTestDatabase ({config, databaseConfig}) {
  if (config.demoData) {
    console.log('clean database and fill with test data')
    let dropResult = await mongoose.connection.db.dropDatabase()
  }
  await initIDs()
  // create default user
  let exist = await User.findOne({username: 'accretion'})
  if (!exist) {
    let user = new User({
      username: 'accretion',
      active: true,
    })
    await user.setPassword('cc')
    await user.save()
  }
  // init with test data
  if (config.demoData) {
    console.log('fill with demoData')
    let da = new fillDemo()
  }
}
async function initProductDatabase () {
  await initIDs()
}

async function init ({config, databaseConfig}) {
  let {bindIp: ip, port} = databaseConfig.net
  let databaseName = config.database
  try {
    await mongoose.connect(`mongodb://${ip}:${port}/accretion`, { useNewUrlParser: true })
  } catch (e) {
    console.error(e)
    let msg = 'Database connetion error, do you realy start the mongodb using the configs/mongod.yml config file???'
    console.error(msg)
    consola.error(msg)
  }
  if (databaseName === "test") {
    await initTestDatabase({config, databaseConfig})
  } else {
    await initProductDatabase()
  }
}
export default init
