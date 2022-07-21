import { createRouter, createWebHistory } from 'vue-router'

import Home from "../views/Home.vue"
//import Data from "../views/Data.vue"
//import Login from "../views/Login.vue"
import Graph from "../views/Graph.vue"
import Test from "../views/Test.vue"
import Main from "../views/Main.vue"
//import firebase from "firebase/app";
//import "firebase/auth";

const routes = [
  
  {
    path: "/",
    name: "Home",
    component: Home,
    meta: {
      title: "Home",
      requiresAuth: false,
    },
    current: true,
  },
  {
    path: "/main",
    name: "Main",
    component: Main,
    meta: {
      title: "Main",
      requiresAuth: false,
    },
    current: false,
  },
  {
    path: "/graph",
    name: "Graph",
    component: Graph,
    meta: {
      title: "Graph",
      requiresAuth: false,
    },
    current: false,
  },
  {
    path: "/test",
    name: "Test",
    component: Test,
    meta: {
      title: "Test",
      requiresAuth: false,
    },
    current: false,
  },
  
  
];


const router = createRouter({
  // 4. Provide the history implementation to use. We are using the hash history for simplicity here.
  history: createWebHistory('/'),
  routes, // short for `routes: routes`
  linkActiveClass: 'text-white bg-gray-900'
})


router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} | Panda Data Viz`;
  next();
});

export {
  router,
}
