import { createApp } from 'vue';
import './assets/style/index.scss';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';

import mComponents from './components/index.js';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);
app.use(mComponents);
app.mount('#app');
