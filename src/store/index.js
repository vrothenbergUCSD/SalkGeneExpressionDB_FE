// import Vue from "vue";
// import Vuex from "vuex";
import { createStore } from 'vuex'
// import firebase from "firebase/app";
// import "firebase/auth";
import firestore from "@/firebase/firebaseInit";

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

  },
  actions: {
    async getCountAct(state) {
      return state.count
    },
    async getStuff() {
      // const dataBase = await db.collection("blogPosts").orderBy("date", "desc");
      // const dbResults = await dataBase.get();
      const db = firestore
      // console.log(db)
      console.log('In getStuff')
      console.log(db)
      const database = await db.collection('test_collection');
      console.log(database)
      const results = await database.get()
      console.log(results)
      return results
    }
  }
})