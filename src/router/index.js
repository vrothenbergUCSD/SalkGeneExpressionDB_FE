import { createRouter, createWebHistory } from 'vue-router'

import Home from "../views/Home.vue"
// import Test from "../views/Test.vue"
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
    name: 'Home',
    component: Home,
    meta: {
      title: "Home",
      requiresAuth: false,

    }
  },
  {
    path: "/line",
    name: "Line",
    component: Main,
    meta: {
      title: "Temporal Gene Expression",
      requiresAuth: false,
    },
  },
  // {
  //   path: "/test",
  //   name: "Test",
  //   component: Test,
  //   meta: {
  //     title: "Test",
  //     requiresAuth: false,
  //   },
  // },
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
