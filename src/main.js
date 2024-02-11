import { createApp } from 'vue'
import 'tailwindcss/tailwind.css'
import './assets/main.css'
import ElementPlus from 'element-plus'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './connections/index.js'


document.body.style.background = "linear-gradient(to right, #f64f59, #c471ed, #12c2e9)";


const app = createApp(App)
app.use(router)
app.use(ElementPlus)
app.mount('#app')


for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
    app.component(key, component)
  }
