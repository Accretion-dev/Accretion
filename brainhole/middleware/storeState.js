import cookie from 'cookie'
let loginPrefix = [
  '/test',
  '/home',
  '/horizon'
]
export default function ({route, redirect, req, store}) {
  // console.log('frontend:', route.path, req)
  console.log('frontend:', route.path)
  if (req && req.user) {
    if (req.user.username !== store.state.username) {
      store.state.username = req.user.username
    }
  } else {
    if (store.state.username) return
    let path = route.fullPath
    let needLogin = loginPrefix.some(_ => path.startsWith(_))
    if (!needLogin) return
    console.log('redirect by frontend', path)
    let redirectPath = `/login/?redirect=${path}`
    redirect(redirectPath)
  }
}
