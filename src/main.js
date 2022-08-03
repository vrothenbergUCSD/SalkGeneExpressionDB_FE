import { createApp } from 'vue'
import { router } from './router'
import { store } from "./store"
import App from './App.vue'
import './index.css'
import 'flowbite'
import PrimeVue from 'primevue/config';
import "primeflex/primeflex.css";
import "primevue/resources/themes/lara-light-blue/theme.css";
import "primevue/resources/primevue.min.css";
import "primeicons/primeicons.css";
// import * as firebase from "firebase";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from 'firebase/firestore/lite';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "rbio-p-datasharing.firebaseapp.com",
  projectId: "rbio-p-datasharing",
  storageBucket: "rbio-p-datasharing.appspot.com",
  messagingSenderId: "1099500985223",
  appId: "1:1099500985223:web:7e039191b77421a17bd122",
  measurementId: "G-H3P87PHKBV"
};

const app = createApp(App)

// Initialize Firebase
const firebase_app = initializeApp(firebaseConfig)

// Initialize Firestore database
const firebase_db = getFirestore(firebase_app)

// Initialize Firebase Authentication and get a reference to the service
const auth = getAuth(firebase_app);

console.log('main.js')
console.log(firebase_db)

export default async function getStuff() {
  console.log('In getStuff')
  console.log(firebase_db)
  const testCol = collection(firebase_db, 'test_collection');
  const testSnapshot = await getDocs(testCol);
  const testList = testSnapshot.docs.map(doc => doc.data());
  return testList;
}

app.use(store)
app.use(router)
app.use(PrimeVue)

app.mount('#app')
