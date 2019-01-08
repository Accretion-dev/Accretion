<template>
  <div class="container">
    <h1>Accretion Register</h1>
    <Form
      ref="form"
      :model="formData"
      :rules="rule"
      class="login-container"
      label-position="left"
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
          label="Password"
          type="password"
          placeholder="Password"
        >
          <Icon
            slot="prepend"
            type="ios-lock-outline"
          />
        </Input>
      </FormItem>
      <FormItem prop="confirm">
        <Input
          v-model="formData.confirm"
          label="Confirm"
          type="password"
          placeholder="Confirm"
        >
          <Icon
            slot="prepend"
            type="ios-lock-outline"
          />
        </Input>
      </FormItem>
      <FormItem style="padding-top: 20px;">
        <Button
          type="success"
          @click="handleSignup('form')"
        >
          Signup
        </Button>
      </FormItem>
    </Form>
    <Alert
      v-show="error"
      type="error"
      show-icon
      >
      {{ error }}
    </Alert>
    <a
      style="color: #c5c8ce;"
      @click="tologin"
    >
      Already have an account?
    </a>
  </div>

</template>

<script>
const prefixCls = 'Accretion-login'
import axios from 'axios'

export default {
  name: 'Register',
  components: { },
  props: {
  },
  data () {
    const validatePassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('Please enter your password'));
      } else {
        if (this.formData.confirm !== '') {
          // 对第二个密码框单独验证
          this.$refs.form.validateField('confirm');
        }
        callback()
      }
    }
    const validateConfirm = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('Please enter your password again'));
      } else if (value !== this.formData.password) {
        callback(new Error('The two input passwords do not match!'));
      } else {
        callback()
      }
    }
    return {
      prefixCls,
      error: '',
      formData: {
        username: '',
        password: '',
        confirm: '',
      },
      rule: {
        username: [
          { required: true, message: 'Please fill in the user name', trigger: 'blur' }
        ],
        password: [
          { validator: validatePassword, trigger: 'blur' }
        ],
        confirm: [
          { validator: validateConfirm, trigger: 'blur' }
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
    tologin(name) {
      let {username, password} = this.formData
      this.$router.push({name: 'login', params: {username, password}})
    },
    handleSignup(name) {
      this.$refs[name].validate((valid) => {
        if (valid) {
          let {username, password} = this.formData
          axios.post(
            '/auth/register/',
            this.formData
          ).then(msg => {
            this.$store.state.username = this.formData.username
            this.$router.push({path: '/'})
          }).catch(error => {
            console.log('error:', error)
            this.error = error.response.data
          })
        } else {
          // this.$Message.error('Fail!');
        }
      })
    }
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
