import passport from 'passport'
import express from 'express'
import Models from '../models/models'
const {User} = Models
let router = express.Router()

router.post('/register/', async (req, res) => {
  let {username, password} = req.body
  let exist = await User.findOne({username})
  if (exist) {
    return res.status(401).send(`User ${username} exists!`)
  } else {
    try {
      let account = await User.register(
        new User({
          username,
          active: true
        }),
        password,
      )
      passport.authenticate('local')(req, res, function () {
        res.redirect('/')
      })
    } catch (err) {
      console.error(err)
      return res.status(401).send(`Register failed with username: ${username}!`)
    }
  }
})

router.post('/login/', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err) }
    if (!user) { return res.status(401).send('Invalid username or password.') }
    if (!user.active) { return res.status(401).send('Not active user') }
    // console.log(`${user} login successfully!`)
    req.login(user, function (error) {
      if (err) { return next(err) }
      // console.log(`${user} go home!`)
      return res.status(200).send()
    })
  })(req, res, next)
})

router.get('/logout/', function (req, res) {
  req.logout()
  res.redirect('/')
})

export default router
