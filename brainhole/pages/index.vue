<template>
  <section class="container">
    <div>
      <logo/>
      <h1 class="title">
        brainhole
      </h1>
      <h2 class="subtitle">
        Brainhole backend for Accretion
      </h2>
      <h3 v-if="$store.state.username">
        Welcome {{ $store.state.username }}
      </h3>
      <div class="links">
        <!-- nav vie frontend -->
        <Button to="/login/">
          login
        </Button>
        <Button @click="urlto('/auth/logout/')">
          logout
        </Button>
        <Button @click="$router.push({name: 'root-test', params: {previousUrl: 'homePage'}})">
          test
        </Button>
      </div>
    </div>
  </section>
</template>

<script>
import Logo from '~/components/Logo.vue'

export default {
  components: {
    Logo
  },
  methods: {
    urlto (url) {
      // fetch page from backend
      window.location.href = url
    }
  }
}
</script>

<style>

.container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: 'Quicksand', 'Source Sans Pro', -apple-system, BlinkMacSystemFont,
    'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
