import debugSettings from './debug-settings'
import 'babel-polyfill'
import WebSocket from 'ws'
import cookieParser from 'cookie-parser'
import bodyParser from 'body-parser'
import serveStatic from 'serve-static'
import passport from 'passport'
import mongoose from 'mongoose'
import database_init from './models'

const express = require('express')
const session = require("express-session")
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const app = express()
const host = process.env.HOST || '127.0.0.1'
const port = process.env.PORT || 3000

d.app = app
d.consola = consola
d.m = mongoose

app.set('port', port)
app.set('strict routing', true)
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}))
app.use(passport.initialize())
app.use(passport.session())

let expressWs = require('express-ws')(app)
// mount routers for backend
let mounted = require('./routes').default(app)

// Import and Set Nuxt.js options
let config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

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
  await database_init()
  const nuxt = new Nuxt(config)

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
}
start()
