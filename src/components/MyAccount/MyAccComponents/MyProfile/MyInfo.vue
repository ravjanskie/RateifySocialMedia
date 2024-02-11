<template>
  <div
    class="border flex flex-row justify-center items-center text-center py-3 mt-3 bg-white"
  >
    <div
      class="flex flex-col justify-center items-center text-center  mx-4"
    >

      <el-form
        :label-position="labelPosition"
        label-width="100px"
        @submit.prevent="updateProfile"

      >
        <Avatar v-model:path="avatar_url" @update:path="handleAvatarUpdate" class="rounded-full" />

        <el-radio-group
        v-model="labelPosition"
        label="Label Position"
        class="mb-4 mx-5 px-4"
      >
        <el-radio-button label="left">Left</el-radio-button>
        <el-radio-button label="right">Right</el-radio-button>
        <el-radio-button label="top">Top</el-radio-button>
      </el-radio-group>
        <el-form-item label="Email">
          <el-input disabled v-model="email" />
        </el-form-item>
        <el-form-item label="Username">
          <el-input v-model="username" />
        </el-form-item>
        <el-form-item label="First Name">
          <el-input v-model="firstname" />
        </el-form-item>
        <el-form-item label="Last Name">
          <el-input v-model="lastname" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="updateProfile" :loading="loading">
            Update Profile
          </el-button>
        </el-form-item>
      </el-form>
      <div v-if="loading">Loading...</div>
    </div>


  </div>
</template>

<script setup lang="ts">
import "../../../../assets/main.css";
import { supabase } from "../../../../connections/supabase";
import { ref } from "vue";
import Avatar from "../MyProfile/MyProfileAvatar.vue/MyAvatar.vue";
import Swal from "sweetalert2";

const loading = ref(false);
const username = ref("");
const firstname = ref("");
const lastname = ref("");
const avatar_url = ref("");
const email = ref("");
const profileError = ref("");
const labelPosition = ref("right");

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

  function handleAvatarUpdate(newPath) {
  avatar_url.value = newPath;
  // Since you want to update the profile immediately after changing the avatar,
  // you should call `updateProfile()` here.
  updateProfile();
}

async function fetchProfile() {
  loading.value = true;

  const { data: {user} } = await supabase.auth.getUser();


  if (user) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) {
      profileError.value = "Failed to fetch profile data: " + error.message;
    } else if (data) {
      username.value = data.username;
      firstname.value = data.firstname;
      lastname.value = data.lastname;
      avatar_url.value = data.avatar_url;
      email.value = data.email;
    }
  } else {
    console.log(Error);
  }

  loading.value = false;
}

async function updateProfile() {
  loading.value = true;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase
      .from("profiles")
      .upsert({
        username: username.value,
        firstname: firstname.value,
        lastname: lastname.value,
        avatar_url: avatar_url.value,
        email: user.email,
        id: user.id,
      })
      .eq("id", user.id);

    if (error) {
            console.error("Error in getPostsAndRatings:", error.message);
    Swal.fire({
      icon: "error",
      title: "Unexpected Error",
      text: error.message,
    });

    } 

    console.error("Succesful Update of Profile!");
    Swal.fire({
      icon: "success",
      title: "Succesfully Updated",
      text: "succesfully updated profile information",
    });
  } else {
    profileError.value = "No user session found.";
  }
  loading.value = false;
}

fetchProfile();
</script>

<style scoped></style>
