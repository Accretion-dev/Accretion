// need to restart backend after this file is modified

// only non-page, non-static, html based url need to login
// * the page ones are handle by frontend
// * the api ones return error json
let needLoginPrefix = [
  '/test',
]
let whiteListPrefix = [
  '/_nuxt',
  '/static',
]
let activeSessions = { }
export default function (req, res, next) {
  console.log('backend:', req.url, req.user)
  if (!req.user) {
    // not login
    if (req.originalUrl.startsWith('/api')) {
      return res.status(401).send(JSON.stringify({
        ok: false,
        message: 'should login first',
      }))
    } else {
      let url = req.originalUrl
      let needLogin = needLoginPrefix.some(_ => url.startsWith(_))
      if (needLogin) {
        console.log(`${url} redirect to login`)
        let redirectURL = `/login/?redirect=${url}`
        if (res.redirect) {
          return res.redirect(redirectURL)
        } else if (res === null && next) {
          // this next is the recirect function from Vue
          return next(redirectURL)
        } else {
          throw Error('Should not be here:', req.url)
        }
      }
    }
  }
  next()
  return
}
