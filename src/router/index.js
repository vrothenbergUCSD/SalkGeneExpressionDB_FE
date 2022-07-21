import { createRouter, createWebHistory } from 'vue-router'

import Home from "../views/Home.vue"
import Graph from "../views/Graph.vue"
import Test from "../views/Test.vue"
import Main from "../views/Main.vue"
//import firebase from "firebase/app";
//import "firebase/auth";

const routes = [
  // will match everything and put it under `$route.params.pathMatch`
  {
    path: "/:pathMatch(.*)*",
    name: 'Home',
    component: Home,
    meta: {
      title: "Home",
      requiresAuth: false,

    }
  },

  {
    path: "/",
    name: "Home",
    component: Home,
    meta: {
      title: "Home",
      requiresAuth: false,
    },
  },
  {
    path: "/main",
    name: "Main",
    component: Main,
    meta: {
      title: "Main",
      requiresAuth: false,
    },
  },
  {
    path: "/graph",
    name: "Graph",
    component: Graph,
    meta: {
      title: "Graph",
      requiresAuth: false,
    },
  },
  {
    path: "/test",
    name: "Test",
    component: Test,
    meta: {
      title: "Test",
      requiresAuth: false,
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes, // short for `routes: routes`
  linkActiveClass: 'text-white bg-gray-900'
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} | RBIO-P Data Sharing`;
  next();
});

export {
  router,
}
