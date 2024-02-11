<template>
  <section class="">
    <div
      class="flex flex-col items-center justify-center px-6 py-8 mx-auto md:h-screen lg:py-0 gradient-body"
    >
      <RouterLink to="/" class="flex items-center space-x-2 my-4">
        <img class="h-8 w-8 md:h-10 md:w-10" :src="RateifyLogo" />
        <h1 class="text-3xl font-semibold text-black">Rateify</h1>
      </RouterLink>
      <div
        class="w-full rounded-lg shadow dark:border md:mt-0 sm:max-w-md xl:p-0 bg-slate-100 dark:bg-gray-800 dark:border-gray-700"
      >
        <div class="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1
            class="text-xl font-bold leading-tight tracking-tight text-gray-900 md:text-2xl dark:text-white"
          >
            Sign in to your account
          </h1>
          <form class="space-y-4 md:space-y-6" action="#">
            <div>
              <label
                for="email"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Your email</label
              >
              <input
                type="email"
                name="email"
                id="email"
                class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="name@company.com"
                required=""
                v-model="email"
              />
            </div>
            <div>
              <label
                for="password"
                class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >Password</label
              >
              <input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                class="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                required=""
                v-model="password"
              />
            </div>
            <!-- <div class="flex items-center justify-between">
                        <div class="flex items-start">
                            <div class="flex items-center h-5">
                              <input id="remember" aria-describedby="remember" type="checkbox" class="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-primary-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-primary-600 dark:ring-offset-gray-800" required="">
                            </div>
                            <div class="ml-3 text-sm">
                              <label for="remember" class="text-gray-500 dark:text-gray-300">Remember me</label>
                            </div>
                        </div>
                        <a href="#" class="text-sm font-medium text-primary-600 hover:underline dark:text-primary-500">Forgot password?</a>
                    </div> -->
            <button
              @click.prevent="login"
              class="w-full text-white bg-primary-600 hover:bg-primary-700 focus:ring-4 focus:outline-none focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800"
            >
              <l-spiral v-if="showLoader" size="40" speed="0.9" color="black">
              </l-spiral>
              <h4 v-if="!showLoader">SIGN-IN</h4>
            </button>
            <p class="text-sm font-light text-gray-500 dark:text-gray-400">
              Don’t have an account yet?
              <RouterLink to="/register" replace>
                <a
                  class="font-medium text-primary-600 hover:underline dark:text-primary-500"
                  >Sign up</a
                >
              </RouterLink>
            </p>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import "../assets/main.css";
import RateifyLogo from "../assets/RateifyLogoBlack.svg";
import { ref } from "vue";
import { supabase } from "../connections/supabase";
import { useRouter } from "vue-router";
import Swal from "sweetalert2";

let showLoader = ref(false);

let email = ref("");
let password = ref("");

const router = useRouter();
//LOGIN
async function login() {
  if (!email.value) {
    console.error("Email must be filled");
    Swal.fire({
      icon: "error",
      title: "Email must be filled",
      text: "Please enter a value",
    });
    return;
  }

  if (!password.value) {
    console.error("Password must be filled");
    Swal.fire({
      icon: "error",
      title: "Password must be filled",
      text: "Please enter a value",
    });
    return;
  }

  try {
    showLoader.value = true;
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });
    if (error) {
      console.log(data);
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: error.message,
      });
      showLoader.value = false;
    } else {
      console.log(!error);
      router.replace({ name: "main" });
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "Logged-in Successfully",
      });
      showLoader.value = false;
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    // Show SweetAlert unexpected error notification
    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: "An unexpected error occurred. Please try again later.",
    });
    showLoader.value = false;
  }
}
</script>

<style scoped></style>
