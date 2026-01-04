import { createApp } from 'vue';
import './assets/style/index.scss';
import App from './App.vue';
import router from './router';

import mComponents from './components/index.js';

const app = createApp(App);

app.use(router);
app.use(mComponents);
app.mount('#app');
