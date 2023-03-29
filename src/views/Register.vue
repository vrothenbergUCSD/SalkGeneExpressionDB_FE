<template>

<div class="surface-card p-4 shadow-2 border-round w-1/2 mx-auto mt-6 lg:w-6">
    <!-- <div class="text-center my-5">
        <div class="text-900 text-3xl font-medium mb-3">Register an account</div>
    </div> -->

    <div class="text-center my-5">
        <!-- <img src="images/blocks/logos/hyper.svg" alt="Image" height="50" class="mb-3"> -->
        <div class="text-900 text-3xl font-medium mb-3">Register an account</div>
        <span class="text-600 font-medium line-height-3">Already have an account?</span>
        <!-- <a class="font-medium no-underline ml-2 text-blue-500 cursor-pointer" href="">Create today!</a> -->
        <router-link to="/login" 
          class="font-medium no-underline ml-2 text-blue-500 cursor-pointer">
          Login
        </router-link>
    </div>
    

    <div class="w-11/12 mx-auto">
        <div class="mb-3">
          <label for="firstName" class="block text-900 font-medium mb-2">First name</label>
          <InputText id="firstName" v-model="firstName" type="text" class="w-full mb-2" :class="{ 'p-invalid': firstNameInvalid }" />
          <small id="firstName-help" class="p-error" v-show="firstNameInvalid">Invalid first name</small>
        </div>
        <div class="mb-3">
          <label for="lastName" class="block text-900 font-medium mb-2">Last name</label>
          <InputText id="lastName" v-model="lastName" type="text" class="w-full mb-2" :class="{ 'p-invalid': lastNameInvalid }" />
          <small id="lastName-help" class="p-error" v-show="lastNameInvalid">Invalid last name</small>
        </div>
        <div class="mb-3">
          <label for="email" class="block text-900 font-medium mb-2">Email</label>
          <InputText id="email" v-model="email" type="text" class="w-full mb-2" :class="{ 'p-invalid': emailInvalid }" />
          <small id="email-help" class="p-error" v-show="emailInvalid">Invalid email address</small>
        </div>
        <div class="mb-3">
          <label for="institution" class="block text-900 font-medium mb-2">Institution</label>
          <small id="institution-help">Optional</small>
          <InputText id="institution" v-model="institution" type="text" class="w-full mb-2" :class="{ 'p-invalid': institutionInvalid }" />
          
          <small id="institution-help-error" class="p-error" v-show="institutionInvalid">Invalid institution</small>
        </div>
        
        <div class="mb-2">
          <label for="password" class="block text-900 w-full font-medium mb-2">Password</label>
          <Password id="password" class="w-full mb-3" inputClass="w-full" 
            :class="{ 'p-invalid' : passwordInvalid }" v-model="password" 
            toggleMask @keyup.enter="register" >
              <template #header>
              <h6>Pick a password</h6>
              </template>
              <template #footer="sp">
                  {{sp.level}}
                  <Divider />
                  <p class="mt-2">Suggestions</p>
                  <ul class="pl-2 ml-2 mt-0" style="line-height: 1.5">
                      <li>At least one lowercase</li>
                      <li>At least one uppercase</li>
                      <li>At least one numeric</li>
                      <li>Minimum 8 characters</li>
                  </ul>
              </template>
          </Password>
          <small id="password-help" class="p-error" v-show="passwordInvalid">Invalid password</small>

        </div>

        <div class="error" v-show="registerErrorMsg">
          {{ registerErrorMsg }}
        </div>
        

        <Button label="Register" icon="pi pi-user" class="w-full" @click="register" @keyup.enter="register"></Button>
    </div>
</div>
</template>

<script>
import InputText from 'primevue/inputtext';
import Password from 'primevue/password';
import Button from 'primevue/button';
import Divider from 'primevue/divider';


import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, addDoc, setDoc } from "firebase/firestore"
import { firestore } from "@/firebase/firebaseInit";

export default {
  name: 'Register',
  components: {
    InputText,
    Password,
    Button,
    Divider,

  },
  data() {
    return {
      firstName: null, 
      firstNameInvalid: null, 
      lastName: null, 
      lastNameInvalid: null, 
      email: null,
      emailInvalid: null,
      password: null, 
      passwordInvalid: null,
      institution: null,
      institutionInvalid: null,

      registerErrorMsg: null,

      user: null,
    }
  },
  methods: {
    async register() {

      this.registerErrorMsg = null;

      // Validate firstName
      if (!this.firstName) {
        console.log('ERROR: Invalid first name')
        this.firstNameInvalid = true
        return 
      }
      this.firstNameInvalid = false

      // Validate lastName
      if (!this.lastName) {
        console.log('ERROR: Invalid last name')
        this.lastNameInvalid = true 
        return
      }
      this.lastNameInvalid = false

      // Validate email
      const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!this.email || !this.email.match(mailformat)) {
        console.log('ERROR: Invalid email')
        this.emailInvalid = true
        return
      }
      this.emailInvalid = false

      // Validate institution
      if (this.institution && this.institution.length > 100) {
        console.log('ERROR: Institution name too long')
        this.institutionInvalid = true 
        return 
      }
      this.institutionInvalid = false

      // Validate password
      const passwordformat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{8,})/;
      if (!this.password || !this.password.match(passwordformat)) {
        console.log('ERROR: Invalid password')
        this.passwordInvalid = true
        return
      }
      this.passwordInvalid = false
      console.log('Passed validation')
      
      const auth = getAuth()
      const createUser = await createUserWithEmailAndPassword(auth, this.email, this.password)
        .catch((err) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          console.log('Error creating user: ', errorMessage)
          if (errorCode =='auth/email-already-in-use') {
            this.registerErrorMsg = "Account already in use."
            return
          }
        })

      const userId = createUser.user.uid

      const newDoc = doc(firestore, 'users', userId)

      await setDoc(doc(firestore, 'users', userId), {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email, 
        institution: this.institution,
        admin: [],
        editor: [],
        reader: [],
      }).catch((err) => {
        console.log('Fail after await setDoc')
        console.log(err)
      })
      console.log('Successfully created new account.')
      
      this.$router.push({ name: "Main" });
      return
    },
  }
}
</script>

<style lang="scss" scoped>
.p-password-input {
    width: 100%,
}

</style>
