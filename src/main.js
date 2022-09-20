import { createApp } from 'vue'
import store from "@/store"
import { router } from '@/router'
import { PrimeVue } from "@/primevue"
import ToastService from 'primevue/toastservice'

import App from './App.vue'

const app = createApp(App)

app.use(store)
app.use(router)
app.use(PrimeVue)
app.use(ToastService)

app.mount('#app')
