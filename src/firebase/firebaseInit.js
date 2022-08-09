
// import firebase from "firebase";
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// import { getPerformance } from "firebase/performance";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'api-key-not-set',
  authDomain: import.meta.env.VITE_AUTH_DOMAIN || 'auth-domain-not-set',
  projectId: import.meta.env.VITE_PROJECT_ID || 'project-id-not-set',
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET || 'storage-bucket-not-set',
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID || 'messaging-sender-id-not-set',
  appId: import.meta.env.VITE_APP_ID || 'app-id-not-set',
}

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

