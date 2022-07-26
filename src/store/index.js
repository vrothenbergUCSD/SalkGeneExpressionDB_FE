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
      profileInstitution: null,
      profileId: null,
      profileInitials: null,
      token: null,
      profileUploader: null,
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
      // console.log('setProfileInfo')
      state.profileId = doc.id;
      state.profileEmail = doc.data().email;
      state.profileFirstName = doc.data().firstName;
      state.profileLastName = doc.data().lastName;
      state.profileInstitution = doc.data().institution
      // console.log(state.profileId);
    },
    setProfileAdmin(state, payload) {
      state.profileAdmin = payload;
    },
    setProfileUploader(state, payload) {
      state.profileUploader = payload;
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
    changeInstitution(state, payload) {
      state.profileInstitution = payload
    },
    setToken(state, payload) {
      state.token = payload
    },

  },
  actions: {
    async getCurrentUser({ commit, dispatch }, user) {
      // const dataBase = await firestore.collection("users").doc(firebase.auth().currentUser.uid);
      // const dbResults = await dataBase.get();
      // console.log('getCurrentUser')
      // console.log(user)

      const result = await getDoc(doc(firestore, 'users', user.uid))
        .catch((err) => {
          console.log('Fail after getDoc')
          console.log(err)
        })
      // console.log('After result')
      if (result.exists()) {
        // console.log('Result exists')
        commit("setProfileInfo", result);
        commit("setProfileInitials");
        const token = await user.getIdTokenResult();
        commit("setToken", token)
        await Promise.all([
          dispatch("getAdmin"),
          dispatch("getUploader"),
        ])
      }
    },
    async updateUserSettings({ commit, state }) {
      // const user = state.user
      // console.log('updateUserSettings')
      // console.log(state.profileId)
      // console.log(state.user)
      const docRef = doc(firestore, "users", state.profileId);
      // console.log(docRef)

      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          firstName: state.profileFirstName,
          lastName: state.profileLastName,
          institution: state.profileInstitution,
        }).catch((err) => {
          console.log('Failed after updateDoc')
        })
        // console.log('Successfully updated user settings')
        commit("setProfileInitials");
      } else {
        console.log(`User id does not exist: ${state.profileId}`)
      }
    },
    async getAdmin({ commit, state }) {
      const docRef = doc(firestore, "admins", state.profileId);
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        commit("setProfileAdmin", true);
      } else {
        commit("setProfileAdmin", false);
      }
    },
    async getUploader({ commit, state }) {
      const docRef = doc(firestore, "uploaders", state.profileId);
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        commit("setProfileUploader", true);
      } else {
        commit("setProfileUploader", false);
      }
    }
  }
})