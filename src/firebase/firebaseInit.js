
// import firebase from "firebase";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getPerformance } from "firebase/performance";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "rbio-p-datasharing.firebaseapp.com",
  projectId: "rbio-p-datasharing",
  storageBucket: "rbio-p-datasharing.appspot.com",
  messagingSenderId: "1099500985223",
  appId: "1:1099500985223:web:7e039191b77421a17bd122",
  measurementId: "G-H3P87PHKBV"
};

const firebaseApp = initializeApp(firebaseConfig);
console.log('firebaseApp')
console.log(firebaseApp)
const auth = getAuth()
const firestore = getFirestore(firebaseApp)
console.log('firestore')
console.log(firestore)
// const performance = getPerformance(firebaseApp)
const storage = getStorage(firebaseApp)

export default {
  auth,
  firestore,
  // performance, 
  storage
};

