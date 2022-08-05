<template>
<div class="surface-card p-4 shadow-2 border-round w-1/2 mx-auto mt-6 lg:w-6 ">
    <div class="text-center mb-5">
        <!-- <img src="images/blocks/logos/hyper.svg" alt="Image" height="50" class="mb-3"> -->
        <div class="text-900 text-3xl font-medium mb-3">Welcome Back</div>
        <span class="text-600 font-medium line-height-3">Don't have an account?</span>
        <!-- <a class="font-medium no-underline ml-2 text-blue-500 cursor-pointer" href="">Create today!</a> -->
        <router-link to="/register" 
          class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">
          Register
        </router-link>
    </div>

    <div>
        <label for="email" class="block text-900 font-medium mb-2">Email</label>
        <InputText id="email" type="text" v-model="email" class="w-full mb-3" />

        <label for="password" class="block text-900 font-medium mb-2">Password</label>
        <InputText id="password" type="password" v-model="password" class="w-full mb-3" />
        <div v-show="error" class="error">{{ this.errorMsg }}</div>

        <div class="flex align-items-center justify-content-between mb-6">
            <div class="flex align-items-center">
                <Checkbox id="rememberme" :binary="true" v-model="checked" class="mr-2"></Checkbox>
                <label for="rememberme">Remember me</label>
            </div>
            <router-link to="/forgot-password" 
              class="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer">
              Forgot password?
            </router-link>
            <!-- <a class="font-medium no-underline ml-2 text-blue-500 text-right cursor-pointer">Forgot password?</a> -->

        </div>

        <Button label="Sign In" icon="pi pi-user" class="w-full" @click="signIn"></Button>
    </div>
</div>
  
</template>

<script>
import InputText from "primevue/inputtext"
import Button from "primevue/button"
import Checkbox from "primevue/checkbox"
// import { auth } from "firebase/firebaseInit"
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { firestore } from "@/firebase/firebaseInit";

export default {
  name: 'Login',
  components: {
    InputText,
    Button,
    Checkbox,
  },
  data() {
    return {
      email: null, 
      password: null, 
      error: null, 
      errorMsg: null, 
      checked: null, 
    }
  },
  methods: {
    signIn() {
      const auth = getAuth()
      signInWithEmailAndPassword(auth, this.email, this.password)
      .then(() => {
        this.error = false;
        this.errorMsg = "";
        const user = auth.currentUser
        console.log(auth.currentUser.uid);
        console.log('Dispatching getCurrentUser')
        this.$store.dispatch('getCurrentUser', user)
        this.$router.push({ name: "Home" });
      })
      .catch((err) => {
        console.log('Sign in error')
        this.error = true;
        // Change to more user friendly message
        this.errorMsg = err.message;
        console.log(err.message)
      });
    }
  }
}
</script>

<style>

</style>