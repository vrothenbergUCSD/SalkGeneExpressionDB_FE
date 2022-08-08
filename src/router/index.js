import { createRouter, createWebHistory } from 'vue-router'

import Home from "../views/Home.vue"
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

import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { firestore } from "@/firebase/firebaseInit";

const routes = [
  // will match everything and put it under `$route.params.pathMatch`
  {
    path: "/:pathMatch(.*)*",
    name: 'Home',
    component: Home,
    meta: {
      title: "Home",
      requiresAuth: false,
      onNavbar: true,
    }
  },
  {
    path: "/",
    name: 'Home',
    component: Home,
    meta: {
      title: "Home",
      requiresAuth: false,
      onNavbar: true,

    }
  },
  {
    path: "/main",
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
          title: "Bar",
          requiresAuth: false,
          onNavbar: false,
        }
      },
      {
        path: "line",
        name: "Line",
        component: LinePlot,
        meta: {
          title: "Line",
          requiresAuth: false,
          onNavbar: false,
        }
      }

    ]
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
  linkActiveClass: 'text-white bg-gray-900'
})

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} | RBIO-P Data Sharing`;
  next();
});

router.beforeEach(async (to, from, next) => {

  const auth = getAuth()
  const user = auth.currentUser;
  // let user = this.$store.state.user
  let admin = null
  if (user) {
    let token = await user.getIdTokenResult();
    admin = token.claims.admin;
  }
  if (to.matched.some((res) => res.meta.requiresAuth)) {
    if (user) {
      if (to.matched.some((res) => res.meta.requiresAdmin)) {
        if (admin) {
          return next();
        }
        return next({ name: "Home" });
      }
      return next();
    }
    return next({ name: "Home" });
  }
  return next();
});

export {
  router,
}
