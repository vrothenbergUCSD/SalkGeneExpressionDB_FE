import { createApp } from 'vue'
import store from "@/store"
import { router } from '@/router'
import { PrimeVue } from "@/primevue"
import ToastService from 'primevue/toastservice'
// import { VueReCaptcha } from 'vue-recaptcha-v3'

import App from './App.vue'

const app = createApp(App)
// app.use(VueReCaptcha, {
//   siteKey: '6LcTdI8kAAAAACUbokBXW8XxlpED2Jrx2BS2rTWu',
//   loaderOptions: {
//     useRecaptchaNet: true
//   }
// })

app.use(store)
app.use(router)
app.use(PrimeVue)
app.use(ToastService)

app.mount('#app')
