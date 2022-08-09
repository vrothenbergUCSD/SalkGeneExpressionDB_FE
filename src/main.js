import { createApp } from 'vue'
import { router } from '@/router'
import { PrimeVue } from "@/primevue"
import store from "@/store"

import App from './App.vue'

const app = createApp(App)

app.use(store)
app.use(router)
app.use(PrimeVue)

app.mount('#app')
