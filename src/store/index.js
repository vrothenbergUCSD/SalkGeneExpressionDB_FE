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
      console.log('setProfileInfo')
      state.profileId = doc.id;
      state.profileEmail = doc.data().email;
      state.profileFirstName = doc.data().firstName;
      state.profileLastName = doc.data().lastName;
      state.profileInstitution = doc.data().institution
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
    changeInstitution(state, payload) {
      state.profileInstitution = payload
    }
  },
  actions: {
    async getCurrentUser({ commit }, user) {
      // const dataBase = await firestore.collection("users").doc(firebase.auth().currentUser.uid);
      // const dbResults = await dataBase.get();
      console.log('getCurrentUser')
      console.log(user)

      const result = await getDoc(doc(firestore, 'users', user.uid))
        .catch((err) => {
          console.log('Fail after getDoc')
          console.log(err)
        })
      console.log('After result')
      if (result.exists()) {
        console.log('Result exists')
        commit("setProfileInfo", result);
        // commit("setProfileInitials");
        const token = await user.getIdTokenResult();
        // console.log('token')
        // console.log(token)
        const admin = await token.claims.admin;
        // console.log('admin')
        // console.log(admin)
        commit("setProfileAdmin", admin);
      }
    },
    async updateUserSettings({ commit, state }) {
      const docSnap = await getDoc(firestore, 'users', user.profileId)
      if (docSnap.exists()) {
        await updateDoc(doc(firestore, 'users', user.profileId), {
          firstName: state.profileFirstName,
          lastName: state.profileLastName,
          username: state.profileUsername,
          institution: state.profileInstitution,
        }).catch((err) => {
          console.log('Failed after updateDoc')
        })
        console.log('Successfully updated user settings')
        commit("setProfileInitials");
      } else {
        console.log(`User id does not exist: ${user.profileId}`)
      }
    },
    async getCountAct(state) {
      return state.count
    },
    async getStuff({ commit }) {
      console.log('In getStuff')
      console.log(firestore)
      const docSnap = await getDoc(doc(firestore, 'users', 'test12'))
      if (docSnap.exists()) {
        console.log('docSnap: ')
        console.log(docSnap)
        console.log(docSnap.id)
        console.log(docSnap.data())
        return docSnap
      } else {
        console.log('Error, document does not exist.')
        return null
      }
    }
  }
})