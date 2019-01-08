import authRedirect from '../common-src/authRedirect' // must from common-src
import cookie from 'cookie'
export default function ({ req, store, redirect, res }) {
  if (!req) return
  if (req.user) {
    if (req.user.username !== store.state.username) {
      store.state.username = req.user.username
    }
  } else {
    if (store.state.username) {
      store.state.username = undefined
    }
    authRedirect(req, redirect)
  }
}
