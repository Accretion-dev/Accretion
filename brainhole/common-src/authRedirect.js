// need to restart backend after this file is modified
let needLoginPrefix = [
  '/test',
]
let whiteListPrefix = [
  '/_nuxt',
  '/static',
]
export default function (req, res, next, fromFrontEnd) {
  // if (req) {
  //   console.log(req.originalUrl)
  // } else {
  //   console.log('null')
  // }
  // Already login
  if (req.user) {
    if (next) {
      next()
    }
    return
  }

  console.log('inside:', req.url, fromFrontEnd)
  // not login
  if (req.url.endsWith('.websocket')) { // process websockets connect
    let ws = req.ws
    ws.send(JSON.stringify({
      ok: false,
      message: 'should login first'
    }))
    return ws.close()
  } else if (req.originalUrl.startsWith('/api')) {
    return res.status(401).send(JSON.stringify({
      ok: false,
      message: 'should login first',
    }))
  } else {
    let url = req.originalUrl
    let needLogin = needLoginPrefix.some(_ => url.startsWith(_))
    if (needLogin) {
      console.log(`${url} redirect to login`, req)
      redirectURL = `/login/?redirect=${url}`
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
  if (next) {
    next()
  }
}
