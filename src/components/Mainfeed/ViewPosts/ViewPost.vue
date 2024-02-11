<template>
  <nav
    class="w-screen sticky top-0 z-50 bg-gray-900 dark:bg-gray-900 px-6 py-5 mx-auto flex justify-start"
  >
    <router-link to="/main" class="flex items-center space-x-2">
      <img class="h-8 w-8 md:h-10 md:w-10" :src="RateifyLogo" />
      <h1
        class="text-xl font-semibold text-zinc-900 hover:text-indigo-400 logoname"
      >
        Rateify
      </h1>
      <h3 class="text-base ml-10 logoname">Go back</h3>
    </router-link>
  </nav>
  <nav
    v-for="(post, index) in data"
    :key="index"
    class="w-screen sticky top-0 z-50 bg-gray-900 dark:bg-gray-900 px-6 py-5 mx-auto flex flex-col justify-center items-center text-center"
  >
    <h1
      class="text-xl md:text-2xl lg:text-3xl text-center font-semibold text-zinc-900 hover:text-indigo-400 logoname"
    >
      Post Title: {{ post.post_title }}
    </h1>
    <span class="text-bold text-base logoname mt-2">
      Posted By: {{ post.user.username }}</span
    >
  </nav>
  <div class="feed-container container">
    <div
      class="w-screen feed-wrapper flex flex-col justify-center items-center my-4"
    >
      <!-- QR Code container -->
      <div class="flex flex-col justify-center mb-4">
        <h1
          class="text-bold text-center text-sm my-3 px-2 md:text-base lg:text-2xl"
        >
          Scan to Share
        </h1>
        <qrcode-vue
          :value="qrCodeValue"
          :Level="level"
          :renderAs="renderAs"
          :size="size"
        />
      </div>
      <div
        v-for="(post, index) in data"
        :key="index"
        class="my-2 rounded w-3/4 md:w-2/3 lg:w-1/2"
      >
        <el-card class="feed">
          <template #header>
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
                    Post Rating {{ calculateAverageRating(post) }}
                  </span>
                  <el-icon><StarFilled /></el-icon>
                </el-tag>
              </div>
            </div>
          </template>
          <div class="feed-card-body">
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
                class="post-image z-10 mb-3 w-auto h-auto md:h-80"
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
                Created {{ formatTimestamp(post.created_at) }}
              </h6>
            </div>
          </template>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import "../../../assets/main.css";
import { supabase } from "../../../connections/supabase";
import { ref, onMounted, onUnmounted } from "vue";
import Swal from "sweetalert2";
import { debounce } from "lodash";
import { useRoute, useRouter } from "vue-router";
import QrcodeVue from "qrcode.vue";
import circleUrl from "../../../assets/default-profile-pic.png";
import RateifyLogo from "../../../assets/RateifyLogoLight.svg";

let loading = ref(false);
const downloading = ref(false);
const data = ref([]);
const noMore = ref();
const currentPage = ref(1);
const postsPerPage = ref(3);

const route = useRoute();
const router = useRouter();

const qrCodeValue = ref("");
const Level = ref("Q");
const RenderAs = ref("svg");
const size = ref("200");

function isScrollAtBottom() {
  const scrollable = document.documentElement;
  return window.innerHeight + window.scrollY >= scrollable.scrollHeight - 10; // 10px offset
}

const debouncedOnScroll = debounce(() => {
  if (isScrollAtBottom() && !loading.value && !noMore.value) {
    currentPage.value += 1;
    getPostsAndRatings(currentPage.value);
  }
}, 300); // 300 milliseconds debounce interval

onMounted(() => {
  window.addEventListener("scroll", debouncedOnScroll);
});

onUnmounted(() => {
  window.removeEventListener("scroll", debouncedOnScroll);
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

const channels = supabase
  .channel("fetch_posts_channel")
  .on(
    "postgres_changes",
    { event: "*", schema: "public", table: "posts" },
    (payload) => {
      // Handle real-time update
      console.log("Change received!", payload);
      getPostsAndRatings(); // Fetch updated posts and ratings
    }
  )
  .subscribe();

const profiles = supabase
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

    const currentPostId = route.params.postID;

    let queryBuilder = supabase
      .from("posts")
      .select(
        `
        *,
        user:profiles (id, username, email, avatar_url)
      `
      )
      .eq("post_id", currentPostId)
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

    if (error) {
      console.error("Error fetching ratings:", error.message);
      return;
    }

    const postIndex = data.value.findIndex((p) => p.post_id === postID);
    if (postIndex !== -1) {
      const post = data.value[postIndex];
      post.ratings = ratings || [];
      post.ratevalue = ratings.length > 0 ? ratings[0].rating_score : 0;
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

    if (error) {
      console.error("Error fetching ratings:", error.message);
    } else {
      const postIndex = data.value.findIndex((p) => p.post_id === postID);
      if (postIndex !== -1) {
        const post = data.value[postIndex];
        post.ratings = ratings;
      }
    }
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
onMounted(async () => {
  const currentPostId = route.params.postID;

  // Set the QR code value to the URL of the current post
  qrCodeValue.value = `${window.location.origin}/viewPost/${currentPostId}`;

  // Call getPostsAndRatings to fetch the data for the current post
  await getPostsAndRatings(currentPage.value);
});
</script>

<style lang="scss">
.logoname,
.hamburgerColor {
  color: #5fbdff !important;
}

@media (max-width: 464px) {
  .feed-container {
    .el-card {
      .el-card__header {
        padding: 10px;
        & > div {
          flex-direction: column-reverse;
          gap: 10px;
        }

        .rate-container {
          text-align: right;
        }
      }
    }
  }
}
</style>
