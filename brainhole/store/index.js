import Vuex from 'vuex'

const createStore = () => {
  return new Vuex.Store({
    state: () => ({
      username: undefined,
    }),
    mutations: {
    }
  })
}

export default createStore
