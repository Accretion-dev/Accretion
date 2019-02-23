import api from './api'
import auth from './auth'
import _ from 'lodash'
import express from 'express'
import authRedirect from '../../common/authRedirect'

function viewReq (req) {
  // console.log(req)
  let data = JSON.stringify(
    _.pick(req, [
      'hostname',
      'user',
      'url',
      'route',
    ]), null, 2
  )
  return data
}

// entry of route
function routes (app) {
  app.use(authRedirect) // mount with no path, act as middleware

  let router = express.Router()
  router.get('/', (req, res, next) => {
    res.send(`<pre>${viewReq(req)}</pre>`)
  })
  //router.ws('/', (ws, req) => {
  //  ws.send(JSON.stringify({
  //    ok: true
  //  }))
  //  ws.send(viewReq(req))
  //})
  app.use('/test/', router)

  app.use('/api/', api)
  app.use('/auth/', auth)
  return app
}
export default routes
