<template>

<div class="surface-card p-4 shadow-2 border-round w-1/2 mx-auto mt-6 lg:w-6">
    <div class="text-center my-5">
        <div class="text-900 text-3xl font-medium mb-3">Register an account</div>
    </div>

    <div class="w-11/12 mx-auto">
        <div class="mb-3">
          <label for="firstName" class="block text-900 font-medium mb-2">First name</label>
          <InputText v-model="firstName" type="text" class="w-full mb-2" :class="{ 'p-invalid': firstNameInvalid }" />
          <small id="firstName-help" class="p-error" v-show="firstNameInvalid">Invalid first name</small>
        </div>
        <div class="mb-3">
          <label for="lastName" class="block text-900 font-medium mb-2">Last name</label>
          <InputText v-model="lastName" type="text" class="w-full mb-2" :class="{ 'p-invalid': lastNameInvalid }" />
          <small id="lastName-help" class="p-error" v-show="lastNameInvalid">Invalid last name</small>
        </div>
        <div class="mb-3">
          <label for="email" class="block text-900 font-medium mb-2">Email</label>
          <InputText v-model="email" type="text" class="w-full mb-2" :class="{ 'p-invalid': emailInvalid }" />
          <small id="email-help" class="p-error" v-show="emailInvalid">Invalid email address</small>
        </div>
        
        <div class="mb-2">
          <label for="password" class="block text-900 w-full font-medium mb-2">Password</label>
          <Password class="w-full mb-3" inputClass="w-full" :class="{ 'p-invalid' : passwordInvalid }" v-model="password" toggleMask >
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
        

        <Button label="Register" icon="pi pi-user" class="w-full" @click="register"></Button>
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

      user: null,
    }
  },
  methods: {
    async register() {

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
          console.log('Fail after await createUserWithEmailAndPassword')
          console.log(err)
        })

      const userId = createUser.user.uid

      const newDoc = doc(firestore, 'users', userId)


      await setDoc(doc(firestore, 'users', userId), {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email, 
      }).catch((err) => {
        console.log('Fail after await setDoc')
        console.log(err)
      })
      console.log('Successfully created new account.')
      // this.$store.commit('updateUser', createUser.user)
      // this.$store.dispatch('getCurren')

      // console.log(result)
      this.$router.push({ name: "Home" });
      return

          // const database = await db.collection('test_collection');
          // console.log(database)
          // const results = await database.get()
          // console.log(results)
          // return results




          // this.user = user
          


          
        //   // ...
        // })
        // .catch((error) => {
        //   const errorCode = error.code;
        //   const errorMessage = error.message;
        //   console.log('Error')
        //   console.log(errorCode)
        //   console.log(errorMessage)
        //   // ..
        // });

    },
  }

}
</script>

<style lang="scss" scoped>
.p-password-input {
    width: 100%,
}

</style>
