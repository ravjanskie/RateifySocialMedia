<template>
  <div class="w-screen bg-white h-screen flex flex-col body">
    <nav
      class="w-screen px-3 sticky top-0 z-50 bg-gray-900 dark:bg-gray-900 py-5 mx-auto md:flex md:justify-between md:items-center"
    >
      <div class="flex items-center justify-between">
        <RouterLink to="/main" class="flex items-center space-x-2">
          <img class="h-8 w-8 md:h-10 md:w-10" :src="RateifyLogo" />
          <h1
            class="text-xl font-semibold text-zinc-900 hover:text-indigo-400 logoname"
          >
            Rateify
          </h1>
        </RouterLink>

        <div
          :class="showMenu ? 'flex' : 'hidden'"
          class="flex flex-row justify-items-end mt-8 space-y-4 white-400 md:flex md:space-y-0 md:flex-row md:items-center md:space-x-10 md:mt-0 md:ml-10"
        >
        <div class="flex flex-row justify-center items-center text-center">
          <button
            v-for="(_, tab) in tabs"
            :key="tab"
            :class="['tab-button', { active: currentTab === tab }]"
            @click="currentTab = tab"
            type="button"
            class="text-base mx-3 px-1 font-semibold text-zinc-900 logoname"
          >
            {{ tab }}
          </button>
        </div>
        <button
          @click="showModal = true"
          class="block justify-self-end my-10 w-28 text-center text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm items-center px-3 py-1"
          type="button"
        >
          Logout
        </button>

        </div>

        <div class="flex md:hidden bg-transparent">
          <el-button @click="visible = true" class="flex-col bg-transparent">
            <svg
              viewBox="0 0 24 24"
              class="w-6 h-6 fill-current hamburgerColor"
            >
              <path
              class="bg-transparent"
                d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z"
              ></path>
            </svg>
          </el-button>
        </div>

        <el-drawer v-model="visible" size="50%" :show-close="false" class="z-50 bg-black" >
          <template #header="{ close }">
            <el-button type="danger" @click="close">
              <el-icon class="el-icon--left"><CircleCloseFilled /></el-icon>
              Close
            </el-button>
          </template>
          <div class="flex flex-col justify-between items-center text-center px-10">
            <button
              v-for="(_, tab) in tabs"
              :key="tab"
              :class="['tab-button', { active: currentTab === tab }]"
              @click="currentTab = tab"
              type="button"
              class="text-base my-5 px-1 font-semibold logoname w-auto"
            >
              {{ tab }}
            </button>
          </div>
          <template #footer>
            <button
              @click="showModal = true"
              class="block justify-self-end my-10 w-28 text-center text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm items-center px-3 py-1"
              type="button"
            >
              Logout
            </button>

            <transition name="fade">
              <div
                v-if="showModal"
                class="fixed top-0 right-0 bottom-0 left-0 ml-0 bg-gray-900 bg-opacity-50 flex justify-center items-center"
              >
                <div class="relative p-4 w-full max-w-md max-h-full">
                  <div
                    class="relative bg-white rounded-lg shadow dark:bg-gray-700"
                  >
                    <button
                      @click="showModal = false"
                      type="button"
                      class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                      data-modal-hide="popup-modal"
                    >
                      <svg
                        class="w-3 h-3"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 14 14"
                      >
                        <path
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                        />
                      </svg>
                      <span class="sr-only">Close modal</span>
                    </button>
                    <div class="p-4 md:p-5 text-center">
                      <svg
                        class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200"
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 20 20"
                      >
                        <path
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                        />
                      </svg>

                      <h3
                        class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400"
                      >
                        Are you sure to Logout?
                      </h3>
                      <input
                        @click="logout"
                        data-modal-hide="popup-modal"
                        type="button"
                        class="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center me-2"
                        :value="loading ? 'Loading ...' : ' Yes, Im sure'"
                        :disabled="loading"
                      />
                      <button
                        @click="showModal = false"
                        data-modal-hide="popup-modal"
                        type="button"
                        class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                      >
                        No, cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </transition>
          </template>
        </el-drawer>
      </div>
      <transition name="fade">
        <div
          v-if="showModal"
          class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center"
        >
          <div class=" p-4 w-full max-w-md max-h-full z-100">
            <div
              class="relative bg-white rounded-lg shadow dark:bg-gray-700 z-100"
            >
              <button
                @click="showModal = false"
                type="button"
                class="absolute top-3 end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                data-modal-hide="popup-modal"
              >
                <svg
                  class="w-3 h-3"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 14 14"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                  />
                </svg>
                <span class="sr-only">Close modal</span>
              </button>
              <div class="p-4 md:p-5 text-center">
                <svg
                  class="mx-auto mb-4 text-gray-400 w-12 h-12 dark:text-gray-200"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 20"
                >
                  <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M10 11V6m0 8h.01M19 10a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
  
                <h3
                  class="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400"
                >
                  Are you sure to Logout?
                </h3>
                <input
                  @click="logout"
                  data-modal-hide="popup-modal"
                  type="button"
                  class="text-white bg-red-600 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 dark:focus:ring-red-800 font-medium rounded-lg text-sm inline-flex items-center px-5 py-2.5 text-center me-2"
                  :value="loading ? 'Loading ...' : ' Yes, Im sure'"
                  :disabled="loading"
                />
                <button
                  @click="showModal = false"
                  data-modal-hide="popup-modal"
                  type="button"
                  class="text-gray-500 bg-white hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 rounded-lg border border-gray-200 text-sm font-medium px-5 py-2.5 hover:text-gray-900 focus:z-10 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-500 dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-gray-600"
                >
                  No, cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </nav>
    <KeepAlive>
      <component :is="tabs[currentTab]" class="tab"></component>
    </KeepAlive>

  </div>
  
</template>

<script setup>
import "../assets/main.css";
import RateifyLogo from "../assets/RateifyLogoLight.svg";
import { ref } from "vue";
import AddPost from "../components/Addpost/Addpost.vue";
import Mainfeed from "../components/Mainfeed/Mainfeed.vue";
import MyAccount from "../components/MyAccount/MyAccount.vue";
import QRScanner from "../components/QRScanner/QRScanner.vue";
import { supabase } from "../connections/supabase";
import { useRouter } from "vue-router";
import { ElButton, ElDrawer } from "element-plus";
import { CircleCloseFilled } from "@element-plus/icons-vue";
import Swal from "sweetalert2";

const visible = ref(false);
const loading = ref(false);
const router = useRouter();
let showMenu = ref(false);
let showModal = ref(false);



const currentTab = ref("Mainfeed");

const tabs = {
  Mainfeed,
  AddPost,
  MyAccount,
  QRScanner,
};


//LOGOUT
async function logout() {
  loading.value = true;
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.log(error);
  } else {
    console.log("logout has been succesful");
    loading.value = false;
    router.push({ name: "home" });
    Swal.fire({
      icon: "success",
      title: "Success!",
      text: "Logged-out Successfully",
    });
  }
}
</script>

<style scoped>
.logoname,
.hamburgerColor {
  color: #5fbdff !important;
}

.fade-enter-active,
.fade-leave-active,
.fade-appear-active {
  transition: opacity 0.5s;
}
.fade-enter,
.fade-leave-to,
.fade-appear {
  opacity: 0;
}
</style>
