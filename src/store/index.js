// import Vue from "vue";
// import Vuex from "vuex";
import { createStore } from 'vuex'
// import firebase from "firebase/app";
// import "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { firestore } from "@/firebase/firebaseInit";

// Vue.use(Vuex);

export default createStore({
  state() {
    return {
      count: 0,
      user: null,
      profileAdmin: null,
      profileEmail: null,
      profileFirstName: null,
      profileLastName: null,
      profileUsername: null,
      profileId: null,
      profileInitials: null,
    }
  },
  getters: {
    getCount(state) {
      return state.count
    }
  },
  mutations: {
    increment(state) {
      state.count++
    },
    updateUser(state, payload) {
      state.user = payload
    },
    setProfileInfo(state, doc) {
      state.profileId = doc.id;
      state.profileEmail = doc.data().email;
      state.profileFirstName = doc.data().firstName;
      state.profileLastName = doc.data().lastName;
      state.profileUsername = doc.data().username;
      console.log(state.profileId);
    },
    setProfileAdmin(state, payload) {
      state.profileAdmin = payload;
      console.log(state.profileAdmin);
    },
    setProfileInitials(state) {
      state.profileInitials =
        state.profileFirstName.match(/(\b\S)?/g).join("") + state.profileLastName.match(/(\b\S)?/g).join("");
    },
    changeFirstName(state, payload) {
      state.profileFirstName = payload;
    },
    changeLastName(state, payload) {
      state.profileLastName = payload;
    },
  },
  actions: {
    async getCurrentUser({ commit }, user) {
      // const dataBase = await firestore.collection("users").doc(firebase.auth().currentUser.uid);
      // const dbResults = await dataBase.get();
      console.log('getCurrentUser')

      const result = await getDoc(doc(firestore.firestore, 'users', user.profileId)).catch((err) => {
        console.log('Fail after getDoc')
        console.log(err)
      })
      console.log('After result')
      if (result.exists()) {
        console.log('Result exists')
        commit("setProfileInfo", result);
        // commit("setProfileInitials");
        const token = await user.getIdTokenResult();
        const admin = await token.claims.admin;
        commit("setProfileAdmin", admin);
      }
    },
    async updateUserSettings({ commit, state }) {
      await updateDoc(doc(firestore, 'users', user.profileId), {
        firstName: state.profileFirstName,
        lastName: state.profileLastName,
        username: state.profileUsername,
      })
      // // const result = await getDoc(doc(firestore, 'users', user.profileId))
      // // const dataBase = await firestore.collection("users").doc(state.profileId);
      // if (result.exist()) {
      //   // commit("setProfileInfo", result)
      //   await 

      // }
      // await dataBase.update({
      //   firstName: state.profileFirstName,
      //   lastName: state.profileLastName,
      //   username: state.profileUsername,
      // });
      commit("setProfileInitials");
    },
    async getCountAct(state) {
      return state.count
    },
    async getStuff({ commit }) {
      // const dataBase = await db.collection("blogPosts").orderBy("date", "desc");
      // const dbResults = await dataBase.get();
      console.log('In getStuff')
      console.log(firestore)
      const docSnap = await getDoc(doc(firestore, 'users', 'test12'))
      if (docSnap.exists()) {
        console.log('docSnap: ')
        console.log(docSnap)
        console.log(docSnap.id)
        console.log(docSnap.data())

      } else {
        console.log('Error, document does not exist.')

      }

      // const results = await database.get()
      // console.log(results)
      return true
    }
  }
})