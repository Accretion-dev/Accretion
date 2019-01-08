<template>
  <section class="container">
    <h1>Already login as</h1>
    <h1> {{ $store.state.username }} </h1>
    <div style="padding-top: 20px;">
      <Button
        type="primary"
        @click="urlto('/auth/logout')"
        >
        Logout
      </Button>
      <Button to="/">
        Home
      </Button>
    </div>
  </section>
</template>

<script>
import Logo from '~/components/Logo.vue'

export default {
  components: {
    Logo
  },
  created () {
  },
  methods: {
  }
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
