import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

console.log('main.ts start')
console.log('router =', router)

createApp(App).use(router).mount('#app')
