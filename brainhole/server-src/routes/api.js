import express from 'express'
import ws from './ws'
let router = express.Router()

router.get('/', (req, res, next) => {
  res.redirect('help')
})
router.get('/help/', (req, res, next) => {
  res.send('help')
})
router.use('/ws/', ws)

export default router
