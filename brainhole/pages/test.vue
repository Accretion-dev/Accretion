<template>
  <section class="container">
    <h1>Test page to show the Navigation behavior of Nuxt</h1>
    <h1> Current route: fullPath:{{ $route.fullPath }}, params:{{ $route.params }}</h1>
    <h1> got props: { previousURL: {{ previousUrl }} }</h1>
    <br>
    <h1>This page is a vue page navigated from the home page, but you can only get here through the homepage</h1>
    <!-- can not get this button work, see comment in toSelf in detail
    <Button @click="toSelf"> To this page again (Navigate by frontend)
    </Button>
    -->
    <Button @click="toHome"> Go Home
    </Button>
    <Button @click="urlto('/test/')">
      Visit the url through backend (Navigate by backend)
    </Button>
    <h1>Refresh this page can also visit the url through backend</h1>
  </section>
</template>

<script>

export default {
  beforeRouteEnter (to, from, next) {
    // console.log('beforeRouteEnter', to, from, this)
    // this is undefined.... not a proper way to get previous route
    next()
  },
  props: {
    previousUrl: {
      default: 'unknown',
      type: [String]
    }
  },
  watch: {
    '$route.params': 'onRouteChange'
  },
  created () {
    if (!this.$store.state.username) {
      this.$router.push('/login/')
    }
  },
  methods: {
    onRouteChange (from, to) {
      console.log('onRouteChange', from, to)
    },
    toSelf () {
      // this is a possible bug for vue, can not push to same router with different params...
      let data = {
        name: 'root-test',
        params: {
          previousUrl: '/test/' + String(Date())
        }
      }
      // console.log(JSON.parse(JSON.stringify(params)))
      this.$router.push(data)
    },
    toHome () {
      let data = {
        path: '/',
      }
      // console.log(JSON.parse(JSON.stringify(params)))
      this.$router.push(data)
    },
    urlto (url) {
      window.location.href = url
    }
  },
}
</script>

<style>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
</style>
