import wsserver from '../wsserver'
let {echo, brainhole} = wsserver
let express = require('express')
let router = express.Router({mergeParams: true})

router.get('/', (req, res, next) => {
  res.send('should use ws')
})
router.ws('/', (ws, req) => {
  // console.log(req)
  ws.send('/echo/: test echo api\n/brainhole/: brainhole backend')
  ws.close(1000)
})
router.ws('/echo/', echo)
router.ws('/brainhole/', brainhole)

export default router
