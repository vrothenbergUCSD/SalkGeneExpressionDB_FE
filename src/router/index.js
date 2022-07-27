import { createRouter, createWebHistory } from 'vue-router'

import Home from "../views/Home.vue"
import Main from "../views/Main.vue"
import BarPlot from "@/components/svg/BarPlot.vue"
import LinePlot from "@/components/svg/LinePlot.vue"
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
      hideNavbar: true,
    }
  },
  {
    path: "/",
    name: 'Home',
    component: Home,
    meta: {
      title: "Home",
      requiresAuth: false,
      hideNavbar: false,

    }
  },
  {
    path: "/main",
    name: "Main",
    component: Main,
    meta: {
      title: "Main",
      requiresAuth: false,
      hideNavbar: false,
    },
    children: [
      {
        path: "bar",
        name: "Bar",
        component: BarPlot,
        meta: {
          title: "Bar",
          requiresAuth: false,
          hideNavbar: true,
        }
      },
      {
        path: "line",
        name: "Line",
        component: LinePlot,
        meta: {
          title: "Line",
          requiresAuth: false,
          hideNavbar: true,
        }
      }

    ]
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
