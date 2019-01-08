<template>
  <div class="container">
    <h1>Accretion Login</h1>
    <!-- <p> {{ $store.state.test }} </p> -->
    <Form
      ref="form"
      :model="formData"
      :rules="rule"
      class="login-container"
      inline
    >
      <FormItem prop="username">
        <Input
          ref="autofocus"
          v-model="formData.username"
          type="text"
          placeholder="Username"
        >
          <Icon
            slot="prepend"
            type="ios-person-outline"
          />
        </Input>
      </FormItem>
      <FormItem prop="password">
        <Input
          v-model="formData.password"
          type="password"
          placeholder="Password"
          @on-enter="handleSubmit('form')"
        >
          <Icon
            slot="prepend"
            type="ios-lock-outline"
          />
        </Input>
      </FormItem>
      <FormItem>
        <Button
          type="primary"
          @click="handleSubmit('form')"
        >
          Login
        </Button>
      </FormItem>
      <Alert
        v-show="error"
        type="error"
        show-icon
        >
        {{ error }}
      </Alert>
      <a
        style="color: #c5c8ce;"
        @click="tosignup"
      >
        Do not have an account?
      </a>
    </Form>
  </div>

</template>

<script>
const prefixCls = 'Accretion-login'
import axios from 'axios'

export default {
  name: 'Login',
  components: { },
  props: {
  },
  asyncData ({params}) {
  },
  data () {
    return {
      prefixCls,
      error: '',
      formData: {
        username: '',
        password: ''
      },
      rule: {
        username: [
          { required: true, message: 'Please fill in the user name', trigger: 'blur' }
        ],
        password: [
          { required: true, message: 'Please fill in the password.', trigger: 'blur' },
        ]
      }
    }
  },
  computed: {
  },
  watch: {
  },
  created () {
    if (this.$store.state.username) {
      this.$router.push('/logout/')
    }
    if (this.$route.params && this.$route.params.username) this.formData.username = this.$route.params.username
    if (this.$route.params && this.$route.params.password) this.formData.password = this.$route.params.password
  },
  updated () {
  },
  mounted () {
    this.$refs['autofocus'].focus()
  },
  methods: {
    handleSubmit(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          // this.$Message.success('Success!');
          axios.post(
            '/auth/login/',
            this.formData
          ).then(msg => {
            console.log('login msg:', msg)
            this.$store.state.username = this.formData.username
            // let ws = new WebSocket('ws://127.0.0.1:3000/api/ws/brainhole/')
            // console.log(ws)
            // ws.onclose = (error) => {
            //   console.log('close because of', error)
            // }
            // ws.onerror = (error) => {
            //   console.log('error because of', error)
            // }
            // ws.onmessage = (msg) => {
            //   console.log('get message: ', msg)
            // }
            // ws.onopen = (msg) => {
            //   console.log('open msg:', msg)
            //   ws.send('hello from client')
            // }
            if (this.$route.query.redirect) {
              this.$router.push({path: this.$route.query.redirect})
            } else {
              this.$router.push('/')
            }
          }).catch(error => {
            console.log('error:', error)
            this.error = error.response.data
          })
        } else {
          // this.$Message.error('Fail!');
        }
      })
    },
    tosignup(name) {
      let {username, password} = this.formData
      this.$router.push({name: 'login-register', params: {username, password}})
    },
  },
}
</script>

<style lang='scss'>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}
.login-container {
  padding-top: 30px;
  display: flex;
  flex-direction: column;
}
</style>
