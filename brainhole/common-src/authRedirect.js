export default function (req, res, next) {
  // if (req) {
  //   console.log(req.originalUrl)
  // } else {
  //   console.log('null')
  // }
  if (req.user) {
    if (next) {
      next()
    }
    return
  }
  if (req.url.endsWith('.websocket')) { // process websockets connect
    let ws = req.ws
    ws.send(JSON.stringify({
      ok: false,
      message: 'should login first'
    }))
    return ws.close()
  } else {
    let url = req.originalUrl
    if ( url !== '/' &&
        !url.startsWith('/favicon.ico') &&
        !url.startsWith('/_') &&
        !url.startsWith('/login') &&
        !url.startsWith('/auth')) {
      console.log(`${url} redirect to login`, req)
      if (res.redirect) {
        return res.redirect('/login/')
      } else {
        let redirect = res
        return redirect('/login/')
      }
    }
  }
  if (next) {
    next()
  }
}
