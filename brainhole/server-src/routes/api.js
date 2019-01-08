import wsserver from '../wsserver'
let {echo, brainhole} = wsserver
let express = require('express')
let router = express.Router({mergeParams: true})

router.get('/', (req, res, next) => {
  ws.send(JSON.stringify({
    '/': 'show all command list'
  }))
})

router.ws('/', (ws, req) => {
  ws.send(JSON.stringify({
    '/echo/': 'echo everything back',
    '/brainhole/': 'echo everything back by brainhole'
  }))
  ws.close(1000)
})
router.ws('/echo/', echo)
router.ws('/brainhole/', brainhole)

export default router
