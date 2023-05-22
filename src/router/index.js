import { createRouter, createWebHistory } from 'vue-router'

import About from "../views/About.vue"
import Main from "../views/Main.vue"
import BarPlot from "@/components/svg/BarPlot.vue"
import LinePlot from "@/components/svg/LinePlot.vue"
import Login from "@/views/Login.vue"
import Register from "@/views/Register.vue"
import User from "@/views/User.vue"
import Admin from "@/views/Admin.vue"
import Profile from "@/views/Profile.vue"
import Settings from "@/views/Settings.vue"
import Data from "@/views/Data.vue"
import ForgotPassword from "@/views/ForgotPassword.vue"
// import NotFound from "@/views/NotFound.vue"

import { onAuthStateChanged } from "firebase/auth";
import { firebaseApp, auth, firestore } from "@/firebase/firebaseInit";
import store from "@/store"

const webapp_title = "RBIO-P Data Sharing"

const routes = [
  // will match everything and put it under `$route.params.pathMatch`
  {
    path: "/:catchAll(.*)*",
    redirect: '/',
  },
  {
    path: "/",
    name: "Main",
    component: Main,
    meta: {
      title: "Main",
      requiresAuth: false,
      onNavbar: true,
    },
    children: [
      {
        path: "bar",
        name: "Bar",
        component: BarPlot,
        meta: {
          title: "Histogram",
          requiresAuth: false,
          onNavbar: false,
        },
      },
      {
        path: "line",
        name: "Line",
        component: LinePlot,
        meta: {
          title: "Line",
          requiresAuth: false,
          onNavbar: false,
        },
      }
    ]
  },
  {
    path: "/about",
    name: 'About',
    component: About,
    meta: {
      title: "About",
      requiresAuth: false,
      onNavbar: true,

    }
  },
  {
    path: "/login",
    name: "Login",
    component: Login,
    meta: {
      title: "Log In",
      requiresAuth: false,
      onNavbar: false,
    }
  },
  {
    path: "/register",
    name: "Register",
    component: Register,
    meta: {
      title: "Register",
      requiresAuth: false,
      onNavbar: false,
    }
  },
  {
    path: "/user",
    name: "User",
    component: User,
    meta: {
      title: "User",
      requiresAuth: true,
      onNavbar: false,
    }
  },
  {
    path: "/admin",
    name: "Admin",
    component: Admin,
    meta: {
      title: "Administration",
      requiresAuth: true,
      // requiresAdmin: true,
      onNavbar: false,
    }
  }
  ,
  {
    path: "/profile",
    name: "Profile",
    component: Profile,
    meta: {
      title: "Profile",
      requiresAuth: true,
      onNavbar: false,
    }
  },
  {
    path: "/settings",
    name: "Settings",
    component: Settings,
    meta: {
      title: "Settings",
      requiresAuth: true,
      onNavbar: false,
    }
  },
  {
    path: "/data",
    name: "Data",
    component: Data,
    meta: {
      title: "Data",
      requiresAuth: true,
      onNavbar: false,
    }
  },
  {
    path: "/forgot-password",
    name: "Forgot Password",
    component: ForgotPassword,
    meta: {
      title: "Forgot Password",
      requiresAuth: false,
      onNavbar: false,
    }
  },

];

const router = createRouter({
  history: createWebHistory(),
  routes, // short for `routes: routes`
  // linkActiveClass: 'text-white bg-gray-900'
})



function checkAuth(to, from, next) {
  const requiresAuth = to.matched.some((route) => route.meta.requiresAuth);

  if (requiresAuth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is authenticated, proceed to the route
        store.commit("setUser", user); // Assuming you have a Vuex store module for user management
        next();
      } else {
        // User is not authenticated, redirect to the login page
        next("/login");
      }
    });
  } else {
    // Page does not require authentication
    next();
  }
}

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} |${webapp_title}`;
  checkAuth(to, from, next);
});


// // Navigation guard
// router.beforeEach(async (to, from, next) => {

//   let user = store.state.user
//   let admin = store.state.profileAdmin

//   if (to.matched.some((res) => { return res.meta.requiresAuth })) {
//     if (user) {
//       // console.log('user exists')
//       // console.log(user)
//       if (to.matched.some((res) => res.meta.requiresAdmin)) {
//         // console.log('requiresAdmin')
//         if (admin) {
//           // console.log('Admin permissions satisifed')
//           return next();
//         }
//         // console.log('No admin')
//         return next({ name: "Home" });
//       }
//       return next();
//     }
//     // console.log('No user')
//     return next({ name: "Home" });
//   } else {
//     // Page does not require authentication
//     // console.log('Auth not needed')
//     return next();
//   }
  
// });

export {
  router,
}
