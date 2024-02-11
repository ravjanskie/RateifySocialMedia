import { createRouter, createWebHistory } from "vue-router";
import Login from "../routes/Login.vue";
import Home from "../routes/Home.vue";
import Main from "../routes/Main.vue";
import Register from "../routes/Register.vue";
import Unauthorized from "../routes/Unauthorized.vue";
import viewPost from "../components/Mainfeed/ViewPosts/ViewPost.vue";
import { supabase } from "../connections/supabase.js";

let localUser;

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      name: "home",
      component: Home,
    },
    {
      path: "/login",
      name: "login",
      component: Login,
    },
    {
      path: "/register",
      name: "register",
      component: Register,
    },
    {
      path: "/main",
      name: "main",
      component: Main,
      meta: { requiresAuth: true }
    },
    {
      path: "/viewPost/:postID",
      name: "viewPost",
      component: viewPost,
      meta: { requiresAuth: true }
    },
    {
      path: "/unauthorized",
      name: "unauthorized",
      component: Unauthorized,
    },
  ],
});

//getUser
async function getUser(next) {
  localUser = await supabase.auth.getSession();
  if (localUser.data.session == null) {
    next("/unauthorized");
  }
  else {
    next();
  }
}

//auth requirements
router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    getUser(next);
  }
  else {
    next();
  }
})

export default router;