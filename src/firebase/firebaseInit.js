
// import firebase from "firebase";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getPerformance } from "firebase/performance";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
}

console.log(import.meta.env.VITE_FIREBASE_API_KEY)

const firebaseApp = initializeApp(firebaseConfig);
// console.log('firebaseApp')
// console.log(firebaseApp)
const auth = getAuth()
const firestore = getFirestore(firebaseApp)
// console.log('firestore')
// console.log(firestore)
// const performance = getPerformance(firebaseApp)
const storage = getStorage(firebaseApp)
const functions = getFunctions(firebaseApp)

export {
  firebaseApp,
  auth,
  firestore,
  // performance, 
  storage,
  functions
};

