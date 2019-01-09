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
import authRedirect from '../common/authRedirect'

const express = require('express')
const session = require("express-session")
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const app = express()
const host = globalConfig.host
const port = globalConfig.port

d.app = app
d.consola = consola
d.m = mongoose
d.express = express

app.set('port', port)
app.set('strict routing', true)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  secret: 'keyboard cat', // TODO: be random later
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())
// app.use(authRedirect) // redirct to login page if not auth

let expressWs = require('express-ws')(app)
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
  const server = nuxt.server
  global.d.nuxt = nuxt

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)

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
