// import Vue from "vue";
// import Vuex from "vuex";
import { createStore } from 'vuex'
// import firebase from "firebase/app";
// import "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { firestore } from "@/firebase/firebaseInit";

// Vue.use(Vuex);

function defaultState() {
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
}

export default createStore({
  state() {
    return defaultState()
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
    async updateUser(state, payload) {
      state.user = payload
    },
    setProfileInfo(state, doc) {
      state.profileId = doc.id;
      state.profileEmail = doc.data().email;
      state.profileFirstName = doc.data().firstName;
      state.profileLastName = doc.data().lastName;
      state.profileInstitution = doc.data().institution
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
    reset(state) {
      Object.assign(state, defaultState())
    }

  },
  actions: {
    // Get user info from Firestore database
    async getCurrentUser({ commit, dispatch }, user) {
      const result = await getDoc(doc(firestore, 'users', user.uid))
      if (result.exists()) {
        commit("setProfileInfo", result);
        commit("setProfileInitials");
        const token = await user.getIdTokenResult();
        commit("setToken", token)
        // Check if user is admin or uploader
        await Promise.all([
          dispatch("getAdmin"),
          dispatch("getUploader"),
        ])
      } else {
        console.error('getCurrentUser: User does not exist in Firestore')
      }
    },
    // Update user settings in Firestore database
    // Used in Profile.vue
    async updateUserSettings({ commit, state }) {
      const docRef = doc(firestore, "users", state.profileId);
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        await updateDoc(docRef, {
          firstName: state.profileFirstName,
          lastName: state.profileLastName,
          institution: state.profileInstitution,
        }).catch((err) => {
          console.error('updateUserSettings: Failed on updateDoc')
          console.error(err)
        })
        commit("setProfileInitials");
      } else {
        console.error(`User id does not exist: ${state.profileId}`)
      }
    },
    // Check if user in admins collections from Firestore database
    async getAdmin({ commit, state }) {
      const docRef = doc(firestore, "admins", state.profileId);
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        commit("setProfileAdmin", true);
      } else {
        commit("setProfileAdmin", false);
      }
    },
    // Check if user in uploaders collections from Firestore database
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