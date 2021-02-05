import { createRouter, createWebHistory } from 'vue-router';

import Home from '@/pages/Home.vue';
import Room from '@/pages/Room.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { name: 'home', path: '/', component: Home },
    { name: 'room', path: '/:id', component: Room },
  ],
});
