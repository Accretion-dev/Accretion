import globals from '../../globals'

async function turnOn () {
  console.log('turn on official plugin')
}
async function turnOff () {
  console.log('turn off official plugin')
}
let plugin = {
  uid: "officialPlugin",
  name: "officialPlugin",
  author: "Fmajor",
  author_email:"",
  description:"Provide several basic Hooks, models and data",
  turnOn,
  turnOff,
}
export default plugin
