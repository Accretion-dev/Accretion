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


async function main () {
  let relogin = false
  let login
  try { // for normal use, no this step (user should already login)
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
    if (relogin) { // for normal use, this process redirect to the login page
      try {
        await www.post( '/auth/login/', defaultUser )
      } catch (e) {
        throw Error('relogin error')
      }
    }
    try {
      info = await www.get('/auth/ws/')
    } catch (e) {
      console.log('=====need relogin=====')
      if (relogin) {
        throw Error('can not auth event after relogin')
      } else {
        relogin = true
      }
      ws.ws.close(1000)
      return
    }
    let {username, sid} = info.data
    try {
      let wsLoginGood = await ws.init({
        id: 'ws-auth',
        "client-name": ws.name,
        "client-type": 'test client',
        username,
        sid,
      })
      console.log('wsLoginGood:', wsLoginGood)
      relogin = false
    } catch (e) {
      console.error('wsLoginBad:', e)
    }
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
