import axios from 'axios'
import Rews from "../utils/reconnect-ws"
import configs from "../configs/config.js"
import WebSocket from 'ws'

const host = configs.host
const port = configs.port

const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')
axiosCookieJarSupport(axios)
const cookieJar = new tough.CookieJar()

const www = axios.create({
  baseURL: `http://${host}:${port}`,
  timeout: 5000,
  withCredentials: true,
  jar: cookieJar,
})

const defaultUser = {
  username: "accretion",
  password: "cc",
}

var d = global.d = {}
d.www = www

var relogin = false

async function main () {
  let login
  try {
    login = await www.post( '/auth/login/', defaultUser )
  } catch (e) {
    console.log('=====login error======')
    throw e
  }
  let ws = new Rews({
    reconnectTime: 5,
    name:'test-ws',
    reconnectMaxCount: 20,
  }, `ws://${host}:${port}/api/ws/`)
  ws.wson('open', async event => {
    let info
    try {
      info = await www.get('/auth/ws/')
    } catch (e) {
      console.log('=====need relogin=====')
      throw e
    }
    let {username, sid} = info.data
    ws.send(JSON.stringify({
      "client-name": ws.name,
      "client-type": 'test client',
      username,
      sid,
    }))
    ws.subscribe([
      {id: 'echo0', command: 'subscribe', configs: {from: 'echo0'}},
      {id: 'echo1', command: 'subscribe', configs: {from: 'echo1'}},
    ])
  })
  ws.wson('message', data => {
    console.log(`client ${ws.name} receive: `, JSON.parse(data.data))
  })
  d.ws = ws
}

main()
let wss = new WebSocket.Server({port: 65233})
