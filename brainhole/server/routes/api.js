let express = require('express')
let router = express.Router({mergeParams: true})

router.get('/', (req, res, next) => {
  let user = req.user
  res.status(200).send(`you are ${user}`)
})

export default router
