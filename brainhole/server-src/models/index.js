import mongoose from 'mongoose'
import testData from '../../test/data/testdata.json'
import debugApi from './debugApi'
import __ from './models'
const {Models, api} = __
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
}

async function initTestDatabase ({config, databaseConfig}) {
  if (config.unittest) {
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
  if (config.unittest) {
    console.log('doing unittest for api')
    let da = new debugApi()
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
