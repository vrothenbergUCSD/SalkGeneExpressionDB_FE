<template>

<div class="surface-card p-4 shadow-2 border-round w-1/2 mx-auto mt-6">
    <div class="text-center my-5">
        <div class="text-900 text-3xl font-medium mb-3">Forgot your password</div>
    </div>
    <div class="text-900 fond-medium mb-5 w-11/12 mx-auto">
      Please enter the email address associated with your account to receive the password reset link.  
    </div>

    <div class="w-11/12 mx-auto">
        <div class="mb-3">
          <label for="email" class="block text-900 font-medium mb-2">Enter your email address</label>
          <InputText v-model="email" type="text" class="w-full mb-2" :class="{ 'p-invalid': emailInvalid }" />
          <small id="email-help" class="p-error" v-show="emailInvalid">{{ errorMsg }}</small>
        </div>
      
        <Button label="Request password reset" icon="pi pi-inbox" class="w-full" @click="resetPassword"></Button>

        <Dialog header="Password reset sent" v-model:visible="display" class="w-5/12" :modal="true">
            <div class="flex items-center justify-center">
                <!-- <i class="pi pi-check mr-3" style="font-size: 2rem" /> -->
                <div>
                  <div class="py-1">A password reset link will be sent to the specified email address.</div>
                  <div class="pt-2">If you don't see the email please check your spam folder.</div>
                </div>
            </div>
            <template #footer class="mx-auto">
                <Button label="Ok" @click="closeModal" autofocus />
            </template>
        </Dialog>
    </div>
</div>
</template>

<script>
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';

import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export default {
  name: "Forgot Password",
  components: {
    InputText,
    Button,
    Dialog,

  },
  data() {
    return {
      email: null,
      emailInvalid: null, 
      display: false,
      errorMsg: null, 

    }
  },
  methods: {
    resetPassword() {
      this.display = false

      // Validate email
      const mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
      if (!this.email || !this.email.match(mailformat)) {
        console.log('ERROR: Invalid email')
        this.emailInvalid = true
        this.errorMsg = "Invalid email address"
        
        return
      }
      
      const auth = getAuth();
      sendPasswordResetEmail(auth, this.email)
        .then(() => {
          // Password reset email sent!
          // ..
          this.display = true
          this.emailInvalid = false
        })
        .catch((error) => {
          const errorCode = error.code;
          const errorMessage = error.message;
          if (errorCode == "auth/user-not-found") {
            // Fail silently 
            this.display = true
            this.emailInvalid = false
            return
          }
          this.errorMsg = "ERROR: Something went wrong."
          
          // ..
          
          
          console.log('ERROR: ')
          console.log(errorCode)
          console.log(errorMessage)
          this.errorMsg = ""
        });


    },
    closeModal() {
      this.display = false
    }

  },


}
</script>

<style>

</style>