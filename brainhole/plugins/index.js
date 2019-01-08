import Vue from 'vue'
import iView from 'iview'
import 'iview/dist/styles/iview.css'

Vue.use(iView)

let plugin = {
  install (Vue, options) {
    Vue.prototype.urlto = url => {
      window.location.href = url
    }
  }
}
Vue.use(plugin)
