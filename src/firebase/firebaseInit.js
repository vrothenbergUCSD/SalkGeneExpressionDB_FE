
// import firebase from "firebase";
import { initializeApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaV3Provider, ReCaptchaEnterpriseProvider, getToken } from "firebase/app-check";
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
let appCheck;

// // Localhost debug
if (process.env.NODE_ENV === 'development') {
  console.log('development mode')

  self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider('debug'),
    // Optional argument. If true, the SDK automatically refreshes App Check
    // tokens as needed.
    isTokenAutoRefreshEnabled: true
  });
} else {
  appCheck = initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaEnterpriseProvider('6LdnxEUlAAAAAImoXr09nDxAoE1eRQn-IDSuGBZW'),
    isTokenAutoRefreshEnabled: true // Set to true to allow auto-refresh.
  });

}






getToken(appCheck)
  .then(() => {
    console.log('getToken success!')
  })
  .catch((error) => {
    console.log('getToken fail!')
    console.log(error.message)
  })

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

