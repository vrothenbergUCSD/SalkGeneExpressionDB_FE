

<template>
  <NavBar/>
  <router-view/>
</template>

<script>
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://vuejs.org/api/sfc-script-setup.html#script-setup
import NavBar from '@/components/NavBar.vue';
//import HelloWorld from './components/HelloWorld.vue'

import { getAuth } from "firebase/auth";

export default {
  name: "App",
  components: {
    NavBar,
  },
  data() {
    return {
      navigation: null,
    }
  },
  created() {
    const auth = getAuth()
    auth.onAuthStateChanged((user) => {
      console.log('Auth changed, user: ')
      console.log(user)
      // this.$store.commit("updateUser", user)
      if (user) {
        console.log('Dispatching..')
        // this.$store.dispatch("getCurrentUser", user)
      }
    })

  }
}
</script>

<style>
#app {
 
}
</style>
