

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
    console.log('App created')

    // Read the status data locally and write it to vuex when loading the page
    if (sessionStorage.getItem("store")) {
      this.$store.replaceState(
        Object.assign(
          {},
          this.$store.state,
          JSON.parse(sessionStorage.getItem("store"))
        )
      );
    }

    //Save the status data in vuex to sessionStorage before page refresh
    window.addEventListener(
    	"beforeunload",()=>{
    	sessionStorage.setItem("store",JSON.stringify(this.$store.state));
    });

    const auth = getAuth()
    auth.onAuthStateChanged((user) => {
      // console.log('Auth changed, user: ')
      // console.log(user)
      this.$store.commit("updateUser", user)
      if (user) {
        // console.log('Dispatching getCurrentUser(user)')
        this.$store.dispatch("getCurrentUser", user)
      } else {
        // console.log('User null')
      }
    })

  }
}
</script>

<style>
#app {
 
}
</style>
