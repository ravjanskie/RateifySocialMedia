<script setup>
import "../../assets/main.css";

import { supabase } from "../../connections/supabase";
import { ref, onMounted, onUnmounted } from "vue";
import Swal from "sweetalert2";
import MyProfile from "../MyAccount/MyAccComponents/MyProfile.vue";
import AddPostImage from "../Addpost/AddPostImage/AddPostImage.vue";

let loading = ref(false);
const downloading = ref(false);
const data = ref([]);
const noMore = ref();
const currentPage = ref(1);
const postsPerPage = ref(5);
const selectedPostId = ref(null);
const showDeleteModal = ref(false);
const deleting = ref(false);
const labelPosition = ref("top");
const editDialogVisible = ref(false);
const editablePost = ref({});

const currentComponent = ref("MyPosts");

function isScrollAtBottom() {
  const scrollable = document.documentElement;
  return window.innerHeight + window.scrollY >= scrollable.scrollHeight - 1000; // 10px offset
}

function onScroll() {
  if (isScrollAtBottom() && !loading.value && !noMore.value) {
    currentPage.value += 1;
    getPostsAndRatings(currentPage.value);
  }
}

onMounted(() => {
  window.addEventListener("scroll", onScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", onScroll);
});

const ratingChannel = supabase
  .channel("fetch_ratings_channel")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "ratings" },
    async (payload) => {
      console.log("Rating Change received!", payload);

      try {
        if (payload && payload.new && payload.new.post_id) {
          const postID = payload.new.post_id;
          // Fetch the latest ratings for the affected post
          await getRatedPosts(postID);
          await getPostRatingVal(postID);
        } else {
          console.warn("Missing or invalid payload structure:", payload);
        }
      } catch (error) {
        console.error("Error handling payload:", error);
      }
    }
  )
  .subscribe();

  const postChannel = supabase
  .channel("fetch_posts_channel")
  .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, (payload) => {
    console.log("Change received!", payload);
    // Handle DELETE event
    if (payload.eventType === "DELETE") {
      const deletedPostId = payload.old.post_id;
      data.value = data.value.filter(post => post.post_id !== deletedPostId);
    } else if (payload.eventType === "INSERT") {
      // Optionally handle INSERT event
      getPostsAndRatings(); // Refresh or append new post to list
    } else if (payload.eventType === "UPDATE") {
      // Specifically handle UPDATE event
      handlePostUpdate(payload.new);
    }
  })
  .subscribe();

const profilesChannel = supabase
  .channel("fetch_profiles_channel")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "profiles" },
    (payload) => {
      // Handle real-time update
      console.log("Change received!", payload);
    }
  )
  .subscribe();

async function getRatedPosts(postID) {
  try {
    const {
      data: {
        user: { id },
      },
    } = await supabase.auth.getUser();

    const { data: ratings, error } = await supabase
      .from("ratings")
      .select("rating_score")
      .eq("post_id", postID)
      .eq("user_id", id);

    console.log("1 getRatedPosts", ratings);

    if (error) {
      console.error("Error fetching ratings:", error.message);
      return;
    }

    const postIndex = data.value.findIndex((p) => p.post_id === postID);
    if (postIndex !== -1) {
      const post = data.value[postIndex];
      post.ratings = ratings || [];

      console.log("2 getRatedPosts", post.ratings);
      post.ratevalue = ratings.length > 0 ? ratings[0].rating_score : 0;

      console.log("3 getRatedPosts", post.ratevalue);

      // Add a flag to indicate if the current user has rated the post
      post.userHasRated = ratings.length > 0;

      data.value.splice(postIndex, 1, post);
    }
  } catch (error) {
    console.error("Error in getRatedPosts:", error.message);
  }
}

async function getPostRatingVal(postID) {
  try {
    const { data: ratings, error } = await supabase
      .from("ratings")
      .select("rating_score")
      .eq("post_id", postID);

    console.log("1 getPostRatingVal", ratings);

    if (error) {
      console.error("Error fetching ratings:", error.message);
    } else {
      const postIndex = data.value.findIndex((p) => p.post_id === postID);
      console.log("2 getPostRatingVal", postIndex);
      if (postIndex !== -1) {
        const post = data.value[postIndex];
        console.log("3 getPostRatingVal", post);
        post.ratings = ratings;
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

async function downloadAvatarImage(user) {
  if (!user.avatar_url) return; // Skip if no avatar URL is provided

  try {
    const { data, error } = await supabase.storage
      .from("avatars")
      .download(user.avatar_url, {
        transform: {
          quality: 20,
        },
      });

    if (error) {
      console.error("Error downloading avatar:", error.message);
      return;
    }

    // Create a blob URL for the avatar data
    const avatarUrl = URL.createObjectURL(data);

    // Update the user object with the blob URL
    user.avatar_blob_url = avatarUrl;
  } catch (error) {
    console.error("Error downloading avatar image:", error.message);
  }
}

async function getPostsAndRatings(page = 1, query = "") {
  if (loading.value) return;

  loading.value = true;
  downloading.value = true;

  try {
    const start = (page - 1) * postsPerPage.value;
    const end = start + postsPerPage.value - 1;

    const {
      data: {
        user: { id },
      },
    } = await supabase.auth.getUser();

    let queryBuilder = supabase
      .from("posts")
      .select(
        `
        *,
        user:profiles (id, username, email, avatar_url)
      `
      )
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .range(start, end);

    if (query.trim()) {
      queryBuilder = queryBuilder.textSearch(
        "title_description_concat",
        `'${query}'`,
        { type: "plain" }
      );
    }

    let { data: newPosts, error } = await queryBuilder;

    if (error) throw new Error("Error fetching posts: " + error.message);

    // Download avatars for each user
    await Promise.all(
      newPosts.map(async (post) => {
        if (post.user && post.user.avatar_url) {
          await downloadAvatarImage(post.user);
        }
      })
    );

    // Continue with existing logic...
    data.value = [
      ...data.value,
      ...newPosts.map((post) => ({
        ...post,
        user: post.user,
        ratevalue: post.ratevalue || 0,
        ratings: [],
        userHasRated: false,
        isLoadingImage: !!post.post_image_url,
      })),
    ];

    await Promise.all(
      data.value.map(async (post) => {
        await getRatedPosts(post.post_id);
        await getPostRatingVal(post.post_id);
        if (post.post_image_url) {
          await downloadImage(post.post_image_url, post);
        }
      })
    );

    noMore.value = newPosts.length < postsPerPage.value;
  } catch (error) {
    console.error("Error in getPostsAndRatings:", error.message);
    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: error.message,
    });
  } finally {
    loading.value = false;
    downloading.value = false;
  }
}

async function downloadImage(postImageUrl, post) {
  try {
    const { data, error } = await supabase.storage
      .from("post_images")
      .download(postImageUrl, {
        transform: {
          resize: "fill",
          quality: 40,
        },
      });

    if (error) {
      console.error("Error downloading image:", error.message);
      return;
    }

    // Create a blob URL for the image data
    const imageUrl = URL.createObjectURL(data);

    // Update the post object with the image URL
    post.image_url = imageUrl;
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function calculateAverageRating(post) {
  // If there are no ratings, return a default value
  if (!Array.isArray(post.ratings) || post.ratings.length === 0) {
    return "0.0";
  }

  // Calculate the total sum of ratings
  const totalRatings = post.ratings.reduce(
    (sum, rating) => sum + rating.rating_score,
    0
  );

  // Calculate the average rating
  const averageRating = totalRatings / post.ratings.length;

  console.log("calculateAverageRating", averageRating);

  // Return the calculated average rating with two decimal places
  return averageRating.toFixed(1);
}

async function submitRating(rating, postID) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { id } = user;
    const post_ID = postID;

    const { data: ratingData, error } = await supabase.from("ratings").upsert(
      [
        {
          rating_score: rating,
          post_id: post_ID,
          user_id: id,
        },
      ],
      { onConflict: ["post_id", "user_id"] }
    );

    if (error) {
      console.error(
        "Error submitting rating:",
        error.message,
        rating,
        post_ID,
        id
      );
      return; // Return early to avoid executing the rest of the code
    }

    console.log("Rating submitted successfully:", ratingData);

    // Ensure data and data.value are defined
    if (data && data.value) {
      const postIndex = data.value.findIndex((p) => p.post_id === postID);
      if (postIndex !== -1) {
        data.value[postIndex].userRating = rating;
        data.value[postIndex].userHasRated = true;
      }
    } else {
      console.error("data or data.value is null or undefined");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function onRatingChange(rating, postID) {
  console.log("Rating changed:", rating, postID);

  if (rating === 0) {
    // If the user unrates a post, remove the rating from the ratings array
    const postIndex = data.value.findIndex((p) => p.post_id === postID);
    if (postIndex !== -1) {
      const post = data.value[postIndex];
      post.ratings = [];
      post.ratevalue = null;
      data.value.splice(postIndex, 1, post);
    }

    deleteRating(postID);
  } else {
    submitRating(rating, postID);
  }

  // Calculate the average rating even if the user unrates a post
  calculateAverageRating(postID);
}

async function deleteRating(postID) {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { id } = user;

    const { data, error } = await supabase
      .from("ratings")
      .delete()
      .eq("post_id", postID)
      .eq("user_id", id);

    if (error) {
      console.error("Error deleting rating:", error.message);
    } else {
      console.log("Rating deleted successfully:", data);
    }

    if (!error) {
      const postIndex = data.value.findIndex((p) => p.post_id === postID);
      if (postIndex !== -1) {
        data.value[postIndex].userRating = 0;
        data.value[postIndex].userHasRated = false;
      }
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

function showConfirmDelete(postId) {
  selectedPostId.value = postId;
  showDeleteModal.value = true;
}

async function deletePost(postID) {
  deleting.value = true;
  try {
    const { error } = await supabase
      .from("posts")
      .delete()
      .match({ post_id: postID });

    if (error) throw error;

    data.value = data.value.filter((post) => post.post_id !== postID);

    Swal.fire({
      icon: "success",
      title: "Deleted!",
      text: "The post has been deleted.",
    });
    showDeleteModal.value = false;
    selectedPostId.value = null;
    deleting.value = false;
  } catch (error) {
    console.error("Error deleting post:", error.message);
    Swal.fire({
      icon: "error",
      title: "Oops...",
      text: "Something went wrong!",
    });
  } finally {
    deleting.value = false;
  }
}

function openEditDialog(post) {
  editablePost.value = {
    id: post.post_id, // Assuming post_id is the unique identifier for posts
    title: post.post_title,
    description: post.post_description,
    post_image_url: post.post_image_url,
  };
  editDialogVisible.value = true;
}

async function submitUpdate() {
  // Ensure properties are correctly referenced
  if (!editablePost.value.title) {
    Swal.fire("Error", "Title and description are required.", "error");
    return;
  }

  // Authentication check
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError) {
    console.error("Authentication error:", authError);
    Swal.fire("Error", "Failed to authenticate user.", "error");
    return;
  }

  // Construct the update payload
  const postPayload = {
    post_title: editablePost.value.title,
    post_description: editablePost.value.description,
    post_image_url: editablePost.value.image_url,
  };

  try {
    const { data, error } = await supabase
      .from("posts")
      .update(postPayload)
      .eq("post_id", editablePost.value.id); // Ensure this ID reference is correct

    if (error) throw error;

    // Handle successful update
    Swal.fire("Success", "Your post has been updated.", "success");
    editDialogVisible.value = false;
  } catch (error) {
    console.error("Update error:", error);
    Swal.fire("Error", "Failed to update the post: " + error.message, "error");
  }
}

const handleImageUpdate = async (newPath) => {
  // Assuming newPath is the storage path for the image
  try {
    const { data: imageData, error } = await supabase.storage.from("post_images").download(newPath);
    if (error) {
      throw error;
    }
    const newBlobUrl = URL.createObjectURL(imageData);
    editablePost.image_url = newBlobUrl; // Update the local editablePost object with the new blob URL
  } catch (error) {
    console.error("Error downloading new image for update:", error.message);
    // Handle error, e.g., by setting a default image or showing an error message
  }
};


async function handlePostUpdate(updatedPost) {
  const index = data.value.findIndex(post => post.post_id === updatedPost.post_id);
  if (index !== -1) {
    // Check if the post's image URL has been updated
    if (updatedPost.post_image_url !== data.value[index].post_image_url) {
      // Download the new image to update the blob URL
      try {
        const { data: imageData, error } = await supabase.storage.from("post_images").download(updatedPost.post_image_url);
        if (error) {
          throw error;
        }
        const newBlobUrl = URL.createObjectURL(imageData);
        updatedPost.image_url = newBlobUrl; // Use this blob URL for the <img> tag
      } catch (error) {
        console.error("Error downloading new image:", error.message);
        // Handle the error appropriately
      }
    }
    // Update the local post object with the new details from updatedPost
    data.value[index] = { ...data.value[index], ...updatedPost, image_url: updatedPost.image_url || data.value[index].image_url };
  } else {
    // If the post isn't found in the current list (e.g., it might be a new addition or outside the current pagination scope)
    data.value.push(updatedPost);
  }
}




function formatTimestamp(timestamp) {
  const now = new Date();
  const postTime = new Date(timestamp);
  const timeDifference = now - postTime;

  // Calculate minutes, hours, and days
  const minutes = Math.floor(timeDifference / (1000 * 60));
  const hours = Math.floor(timeDifference / (1000 * 60 * 60));
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

  // Format based on time difference
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (days < 7) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else {
    // If more than a week, show the date
    const options = { year: "numeric", month: "long", day: "numeric" };
    return postTime.toLocaleDateString(undefined, options);
  }
}

// Initialization
getPostsAndRatings(currentPage.value);
</script>

<template>
  <nav
    class="w-screen sticky top-0 z-10 bg-gray-900 dark:bg-gray-900 px-6 pt-5 mx-auto flex flex-col justify-center items-center text-center"
  >
    <h1
      class="text-xl md:text-2xl lg:text-3xl text-center font-semibold text-zinc-900 hover:text-indigo-400 logoname"
    >
      My Account
    </h1>
    <div class="w-screen">
      <div class="flex justify-center items-center text-center pt-3 z-50">
        <button
          @click="currentComponent = 'MyPosts'"
          :class="{
            active: currentComponent === 'MyPosts',
            'w-1/2 border-b-8 border-gray-900 bg-gray-900 dark:bg-gray-900 shadow-2xl py-3 hover:border-blue-500 text-white hover:text-sky-400': true,
          }"
        >
          See My Posts
        </button>
        <button
          @click="currentComponent = 'MyProfile'"
          :class="{
            active: currentComponent === 'MyProfile',
            'w-1/2 border-b-8 border-gray-900 bg-gray-900 dark:bg-gray-900 shadow-2xl py-3 hover:border-blue-500 text-white hover:text-sky-400': true,
          }"
        >
          See My Profile
        </button>
      </div>
    </div>
    <!-- DELETE MODAL -->
    <transition name="fade">
      <div
        v-if="showDeleteModal"
        class="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center"
      >
        <div
          class="bg-white p-4 w-full max-w-md dark:bg-gray-700 rounded-lg shadow-lg"
        >
          <button
            @click="showDeleteModal = false"
            class="absolute top-3 right-2.5 text-gray-400 hover:text-gray-900"
          >
            <!-- Close Icon -->
          </button>
          <div class="text-center">
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
            <h3 class="mb-5 text-lg font-normal text-white">
              Are you sure you want to delete this post?
            </h3>
            <div class="flex justify-center">
              <button
                @click="deletePost(selectedPostId)"
                class="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg mr-2"
                :class="{ 'cursor-not-allowed': deleting }"
                :disabled="deleting"
              >
                {{ deleting ? "Deleting..." : "Yes, Delete It" }}
              </button>
              <button
                @click="showDeleteModal = false"
                class="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <!-- DELETE MODAL -->
  </nav>

  <div>
    <div v-if="currentComponent === 'MyPosts'">
      <div class="flex justify-center mt-2 mb-4">
        <h1 class="text-xl md:text-2xl lg:text-3xl">See All My Posts</h1>
      </div>

      <div class="feed-container container">
        <div
          style="overflow: auto"
          class="w-screen feed-wrapper flex flex-col justify-center items-center my-4"
        >
          <div
            v-for="(post, index) in data"
            :key="index"
            class="my-2 rounded w-3/4 md:2/3 lg:w-1/2"
          >
            <el-card class="relative">
              <template #header>
                <div class="mb-3 text-end">
                  <button
                    @click="openEditDialog(post)"
                    class="border-transparent"
                  >
                    <el-icon
                      style="font-size: 20px"
                      color="#409EFC"
                      class="no-inherit"
                    >
                      <Edit />
                    </el-icon>
                  </button>
                  <button @click="showConfirmDelete(post.post_id)" class="ml-2">
                    <el-icon style="font-size: 20px" color="red">
                      <DeleteFilled
                    /></el-icon>
                  </button>
                </div>

                <div class="flex justify-between">
                  <div class="user-profile flex align-middle">
                    <div class="user-avatar flex items-center">
                      <el-avatar
                        v-if="post.user.avatar_blob_url"
                        :src="post.user.avatar_blob_url"
                        size="32"
                      />
                    </div>
                    <div class="ml-3 user-info w-fit">
                      <span class="text-bold text-base">
                        {{ post.user.username }}</span
                      >
                      <h6 class="text-xs text-end">
                        Created {{ formatTimestamp(post.created_at) }}
                      </h6>
                    </div>
                  </div>
                  <div class="rate-container">
                    <el-tag
                      type="primary"
                      class="mx-1 flex items-center justify-center bg-sky-600"
                      effect="dark"
                      round
                    >
                      <span class="pr-score text-white">
                        Overall Rating {{ calculateAverageRating(post) }}
                      </span>
                      <el-icon><StarFilled /></el-icon>
                    </el-tag>

                    <div class="flex pr-wrapper"></div>
                  </div>
                </div>
              </template>
              <div class="feed-card-body">
                <div
                  class="text-lg text-bold mb-3 pb-2 pl-2 md:text-xl lg:text-4xl"
                >
                  {{ post.post_title }}
                </div>

                <div
                  v-if="downloading"
                  class="flex justify-center items-center text-center"
                >
                  <l-grid
                    v-if="!post.image_url"
                    size="70"
                    speed="1.5"
                    color="black"
                    class="my-4"
                  ></l-grid>
                </div>

                <div
                  v-if="post.image_url"
                  class="flex justify-center items-center text-center"
                >
                  <img
                    :src="post.image_url"
                    alt="Post Image"
                    class="post-image mb-3 w-auto h-auto md:h-80"
                  />
                </div>

                <div class="details text-sm mx-3 px-2 md:text-base lg:text-2xl">
                  {{ post.post_description }}
                </div>
              </div>
              <template #footer>
                <p
                  v-if="post.userHasRated"
                  class="text-xs md:text-sm lg:text-base my-1"
                >
                  You rated this post a {{ post.ratevalue }}.
                </p>
                <p v-else class="text-xs md:text-sm lg:text-base my-1">
                  Rate this post from 1 to 5
                </p>
                <el-rate
                  v-model="post.ratevalue"
                  :colors="colors"
                  class="flex align-middle"
                  text-color="#ff9900"
                  allow-half
                  clearable
                  show-score
                  @change="onRatingChange(post.ratevalue, post.post_id)"
                />

                <div class="ml-3 mt-3 user-info">
                  <span class="text-bold"></span>
                  <h6 class="text-xs text-end">
                    {{ formatTimestamp(post.created_at) }}
                  </h6>
                </div>
              </template>
            </el-card>
          </div>
        </div>

        <div class="w-screen flex justify-center items-center">
          <l-spiral
            v-if="loading"
            size="40"
            speed="0.9"
            color="black"
            class="text-center my-4"
          >
          </l-spiral>
          <p
            v-if="noMore"
            class="text-center my-3 text-sm md:text-base lg:text-2xl"
          >
            No more posts
          </p>
        </div>
      </div>

      <el-backtop visibility-height :right="40" :bottom="40" />
    </div>

    <MyProfile v-else />

    <!-- EDIT MODAL -->
    <div
      v-if="editDialogVisible"
      class="fixed inset-0 bg-slate-900 bg-opacity-50 flex justify-center items-center z-20"
    >
      <div
        class="bg-white dark:bg-gray-900 p-4 md:p-8 lg:p-12 rounded-lg shadow-lg max-w-md w-full"
      >
        <h2 class="text-xl dark:text-white font-semibold mb-4">Edit Post</h2>
        <div class="space-y-4">
          <div>
            <label
              for="postTitle"
              class="block text-sm font-medium text-gray-700 dark:text-white"
              >Post Title</label
            >
            <input
              type="text"
              id="postTitle"
              v-model="editablePost.title"
              class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            />
          </div>
          <div>
            <label
              for="postDescription"
              class="block text-sm font-medium text-gray-700 dark:text-white"
              >Description</label
            >
            <textarea
              id="postDescription"
              v-model="editablePost.description"
              rows="4"
              class="shadow-sm bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 dark:shadow-sm-light"
            ></textarea>
          </div>
          <AddPostImage
            v-model:path="editablePost.image_url"
            @update:path="handleImageUpdate"
            @upload="updateProfile"
            @uploading="handleUploadingState"
            size="10"
          />
        </div>
        <div class="mt-6 flex justify-end space-x-4">
          <button
            @click="editDialogVisible = false"
            class="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            @click="submitUpdate"
            class="py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Update
          </button>
        </div>
      </div>
    </div>
    <!-- EDIT MODAL -->
  </div>
</template>

<style scoped>
.active {
  border-color: #5fbdff;
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
