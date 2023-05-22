<template>
  <div class="flex flex-col min-h-screen">
    <NavBar/>
    <router-view/>
    <Footer/>

  </div>
  
</template>

<script>

import NavBar from '@/components/NavBar.vue';
import Footer from '@/components/Footer.vue'
import { getAuth } from "firebase/auth";

export default {
  name: "App",
  components: {
    NavBar,
    Footer,
  },
  data() {
    return {
      navigation: null,
    }
  },
  async created() {
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

    // Save the status data in vuex to sessionStorage before page refresh
    window.addEventListener(
    	"beforeunload",()=>{
    	sessionStorage.setItem("store",JSON.stringify(this.$store.state));
    });

    const auth = getAuth()
    auth.onAuthStateChanged((user) => {
      // Update the user information in the Vuex store
      this.$store.commit("updateUser", user)
      if (user) {
        // Dispatch the getCurrentUser action to retrieve user's information
        // from firestore and update the user information in the Vuex store
        this.$store.dispatch("getCurrentUser", user)
      } else {
        console.log("App: No user")
      }
      console.log('App: After auth state changed')
    })

  },
}
</script>



