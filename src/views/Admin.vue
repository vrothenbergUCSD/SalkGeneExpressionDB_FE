<template>
  <div class="admin">
    <div class="container">
      <h2>Administration</h2>
      <div class="admin-info">
        <h2>Add Admin</h2>
        <div class="input">
          <input placeholder="Enter user email to make them an admin" type="text" id="addAdmins" v-model="adminEmail" />
        </div>
        <span>{{ this.functionMsg }}</span>
        <button @click="addAdmin" class="button">Submit</button>
      </div>
    </div>
  </div>
</template>

<script>
// import firebase from "firebase/app";
import "firebase/functions";
import { getAuth } from "firebase/auth";

export default {
  name: "Admin",
  data() {
    return {
      adminEmail: "",
      functionMsg: null,
    };
  },
  methods: {
    async addAdmin() {
      const addAdmin = await firebase.functions().httpsCallable("addAdminRole");
      const result = await addAdmin({ email: this.adminEmail });
      this.functionMsg = result.data.message;
    },
  },
}
</script>

<style>

</style>