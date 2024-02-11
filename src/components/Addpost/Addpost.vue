<template>
  <nav
    class="w-screen sticky top-0 z-10 bg-gray-900 dark:bg-gray-900 px-6 py-5 mx-auto flex justify-center items-center text-center"
  >
    <h1
      class="text-xl md:text-2xl lg:text-3xl text-center font-semibold text-zinc-900 hover:text-indigo-400 logoname"
    >
      Add Post
    </h1>
  </nav>
  <div class="flex flex-col justify-center items-center">
    <div class="rounded container my-3 py-4">
      <div class="w-90">
        <h1 class="text-xl w-90 text-black text-center break-words">My Post</h1>
        <h3 class="text-base w-90 text-black text-center break-words">
          Post about the things you want to rate, rate your cat, rate the food
          you ate, rate your toothbrush, rate your cousin, rate Anything! there
          are no limitations!
        </h3>
      </div>
    </div>

    <div class="rounded container py-4 flex justify-center">
      <form class="w-3/4 md:2/3 lg:w-1/2">
        <div class="mb-5">
          <input
            v-model="post_title"
            type="text"
            id="post-title"
            class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Title of Post"
            required
          />
        </div>

        <div class="mb-5">
          <textarea
            v-model="post_description"
            type="text"
            id="post-description"
            rows="4"
            class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            placeholder="Write a description"
            required
          />
        </div>

        <div class="mb-5 rounded">
          <AddPostImage
            v-model:path="post_image_url"
            @upload="updateProfile"
            @uploading="handleUploadingState"
            size="10"
          />
        </div>

        <div class="w-full flex justify-end">
          <button
            @click.prevent="addPost"
            :disabled="isUploading"
            type="submit"
            class="text-center flex justify-center items-center w-1/3 text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 mt-5 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          >
            <l-spiral
              v-if="showLoader"
              size="40"
              speed="0.9"
              color="black"
              class="text-center"
            >
            </l-spiral>
            <h4 v-if="!showLoader && !isUploading" class="text-center">Save</h4>
            <div v-else-if="isUploading" class="loader">Uploading...</div>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import "../../assets/main.css";
import AddPostImage from "../Addpost/AddPostImage/AddPostImage.vue";
import { ref } from "vue";
import { supabase } from "../../connections/supabase";
import Swal from "sweetalert2";

let showLoader = ref(false);
const post_title = ref(null);
const post_description = ref(null);
const post_image_url = ref("");

const isUploading = ref(false);

function handleUploadingState(uploading) {
  isUploading.value = uploading;
}

async function addPost() {
  showLoader.value = true;

  if (!post_title.value) {
    console.error("Title must be filled");
    Swal.fire({
      icon: "error",
      title: "Title must be filled",
      text: "Please enter give this post a Title",
    });
    showLoader.value = false;
    return;
  }

  const { data } = await supabase.auth.getUser();

  try {
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert([
        {
          post_title: post_title.value,
          post_description: post_description.value,
          post_image_url: post_image_url.value,
          user_id: data.user.id,
        },
      ])
      .select();

    if (postError) {
      console.error(postError);
      showError("Error", postError.message);
      return;
    }

    const postID = postData[0].post_id;

    console.log("Successful", postID);

    post_title.value = "";
    post_description.value = "";
    post_image_url.value = "";
  } catch (error) {
    console.error("Unexpected Error", error);
    showError("Unexpected Error", error.message);
  } finally {
    location.reload();
    Swal.fire({
      icon: "success",
      title: "Successful",
      text: "Successfully Added ",
    });
    showLoader.value = false;
  }
}

const channels = supabase
  .channel("insert_posts_channel")
  .on(
    "postgres_changes",
    { event: "INSERT", schema: "public", table: "posts" },
    (payload) => {
      console.log("Change received!", payload);
    }
  )
  .subscribe();
</script>

<style scoped></style>
