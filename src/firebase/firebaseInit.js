
// import firebase from "firebase";
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions"

const firebaseConfig = {
  // apiKey: import.meta.env.FIREBASE_API_KEY,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
}

// console.log(import.meta.env.VITE_FIREBASE_API_KEY)

const firebaseApp = initializeApp(firebaseConfig);

const appCheck = initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaV3Provider('6LcTdI8kAAAAACUbokBXW8XxlpED2Jrx2BS2rTWu'),

  // Optional argument. If true, the SDK automatically refreshes App Check
  // tokens as needed.
  isTokenAutoRefreshEnabled: true
});

const auth = getAuth()
const firestore = getFirestore(firebaseApp)
const storage = getStorage(firebaseApp)
const functions = getFunctions(firebaseApp)



export {
  firebaseApp,
  auth,
  firestore,
  storage,
  functions
};

