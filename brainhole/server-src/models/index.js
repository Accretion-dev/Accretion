import mongoose from 'mongoose'
import Models from './models'
const User = Models.User

async function init () {
  await mongoose.connect('mongodb://127.0.0.1:23666/accretion', { useNewUrlParser: true })
  let exist = await User.findOne({username: 'accretion'}).exec()
  // console.log('exist:', exist)
  if (!exist) {
    let user = new User({
      username: 'accretion',
      active: true,
    })
    await user.setPassword('cc')
    await user.save()
    console.log('Create accretion account')
  }
  // const { user } = await DefaultUser.authenticate()('user', 'password');
}
export default init
