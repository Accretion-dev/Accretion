import mongoose from 'mongoose'
import Models from './models'
const consola = require('consola')
const User = Models.User

async function initTestDatabase () {
  // create default user
  let exist = await User.findOne({username: 'accretion'}).exec()
  if (!exist) {
    let user = new User({
      username: 'accretion',
      active: true,
    })
    await user.setPassword('cc')
    await user.save()
  }
  // init with test data
  // TODO
}
async function initProductDatabase () {
  // TODO: low
}

async function init ({config, databaseConfig}) {
  let {bindIp: ip, port} = databaseConfig.net
  let databaseName = databaseConfig.database
  try {
    await mongoose.connect(`mongodb://${ip}:${port}/accretion`, { useNewUrlParser: true })
  } catch (e) {
    console.error(e)
    let msg = 'Database connetion error, do you realy start the mongodb using the configs/mongod.yml config file???'
    console.error(msg)
    consola.error(msg)
  }
  if (databaseName === "test") {
    await initTestDatabase()
  } else {
    await initProductDatabase()
  }
}
export default init
