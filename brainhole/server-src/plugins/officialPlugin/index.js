import globals from '../../globals'

async function turnOn () {
}
async function turnOff () {
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
