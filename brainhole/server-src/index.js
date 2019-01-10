import debugSettings from './debug-settings'
import 'babel-polyfill'
import WebSocket from 'ws'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import serveStatic from 'serve-static'
import passport from 'passport'
import mongoose from 'mongoose'
import database_init from './models'
import globalConfig from "../configs/config.js"
import yaml from 'node-yaml'
import Subwss from './api/wsserver.js'

const express = require('express')
const session = require("express-session")
const consola = require('consola')
// const cors = require('cors')
const { Nuxt, Builder } = require('nuxt')
const app = express()
const host = globalConfig.host
const port = globalConfig.port

d.app = app
d.consola = consola
d.m = mongoose

app.set('port', port)
app.set('strict routing', true)
//app.use(cors({
//  // credentials: true,
//  // origin: `http://${host}:${port}`
//}))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
const currentSession = session({
  secret: 'keyboard cat', // TODO: be random later
  resave: false,
  saveUninitialized: false,
})
d.session = currentSession
app.use(currentSession)
app.use(passport.initialize())
app.use(passport.session())

// mount routers for backend
let mounted = require('./routes').default(app)

// Import and Set Nuxt.js options
let config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

d.nuxtConfig = config
d.config = globalConfig
d.yaml = yaml
d.app = app
let databaseConfig = yaml.readSync('../configs/mongod.yml')
d.databaseConfig = databaseConfig

// auth
// let User = require('./models/models').default.User
const Models = require('./models/models').default
let User = Models.User
const LocalStrategy = require('passport-local').Strategy
passport.use(new LocalStrategy(User.authenticate()))
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

async function start() {
  // Init Nuxt.js
  await database_init({config: globalConfig, databaseConfig})
  const nuxt = new Nuxt(config)
  global.d.nuxt = nuxt

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  const server = app.listen(port, host)
  let subwss = new Subwss({server, path: '/api/ws/'})
  subwss.on('echo0', function (data) {
    let name = 'echo0'
    let that = wss
    let id = name
    console.log(`on ${name}:`, data)
    let subscribes = that.subscribes.get(id)
    if (!subscribes) return
    subscribes.forEach(ws => {
      ws.sequence += 1
      ws.subscribeCount[id] += 1
      let configs = ws.subscribeConfigs[id]
      ws.send(JSON.stringify({
        ok: true,
        sequence: ws.sequence,
        subsequence: ws.subscribeCount[id],
        configs,
        id,
        res: data
      }))
    })
  })
  subwss.on('echo1', function (data) {
    let name = 'echo1'
    let that = wss
    let id = name
    console.log(`on ${name}:`, data)
    let subscribes = that.subscribes.get(id)
    if (!subscribes) return
    subscribes.forEach(ws => {
      ws.sequence += 1
      ws.subscribeCount[id] += 1
      let configs = ws.subscribeConfigs[id]
      ws.send(JSON.stringify({
        ok: true,
        sequence: ws.sequence,
        subsequence: ws.subscribeCount[id],
        configs,
        id,
        res: data
      }))
    })
  })
  global.d.subwss = subwss

  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
  if (globalConfig.database == 'test') {
    consola.warn({
      message: `You are using the 'test' database, Accretion is thus in the test mode.\n  * The database will be reset by test data each time you start the brainhole.\n  * Use other database name if you want to use the Accretion normally\n  * See the config file 'configs/config.js'`,
      badge: true
    })
  }
}
start()
