<script setup>
import { ref, toRefs } from "vue";
import { supabase } from "../../../connections/supabase";

const prop = defineProps(["path"]);
const { path } = toRefs(prop);

const emit = defineEmits(["upload", "update:path"]);
const uploading = ref(false);

const deleting = ref(false);
const src = ref("");
const files = ref();

const uploadPostImage = async (evt) => {
  files.value = evt.target.files;
  uploading.value = true;
  emit("uploading", true);
  try {
    if (!files.value || files.value.length === 0) {
      throw new Error("You must select an image to upload.");
    }

    const file = files.value[0];
    const fileExt = file.name.split(".").pop();
    const filePath = `${Math.random()}.${fileExt}`;

    // Display the image locally immediately after uploading
    const reader = new FileReader();
    reader.onload = (e) => {
      src.value = e.target.result;
    };
    reader.readAsDataURL(file);

    const { error: uploadError } = await supabase.storage
      .from("post_images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    emit("update:path", filePath);
    emit("upload");
  } catch (error) {
    alert(error.message);
  } finally {
    uploading.value = false;
    emit("uploading", false);
  }
};

const deletePostImage = async () => {
  try {
    deleting.value = true;
    if (path.value) {
      const { error: deleteError } = await supabase.storage
        .from("post_images")
        .remove([path.value]);

      if (deleteError) throw deleteError;

      // Clear the path and source after successful deletion
      emit("update:path", "");
      src.value = "";
    } else {
      throw new Error("No image to delete.");
    }
  } catch (error) {
    alert(error.message);
  } finally {
    deleting.value = false;
  }
};
</script>

<template>
  <div
    class="flex flex-col justify-center items-center rounded w-full text-center py-3 bg-slate-100 border border-slate-100 dark:bg-gray-700 dark:border-gray-600"
  >
    <label class="text-center py-2 text-green-600 dark:text-white">
      {{ uploading ? "Uploading Image to Server..." : "" }}
    </label>
    <img
      v-if="src"
      :src="src"
      alt="Post Image"
      class="my-5 w-auto h-40 md:h-64"
    />
    <div v-else class="flex flex-col justify-center items-center my-5">
      <l-grid size="50" speed="1.5" color="dodgerblue"></l-grid>
    </div>

    <!-- FOR DELETING CURRENT UPLOADED PICTURE -->
    <div
      v-if="src"
      class="w-1/2 border flex justify-center items-center rounded border-red-600 my-2 bg-red-600 hover:bg-red-800 hover:border-red-800"
    >
      <button
        class="button primary block text-center py-2 text-white"
        @click="deletePostImage"
        :disabled="deleting"
      >
        {{ deleting ? "Deleting..." : "Delete" }}
      </button>
    </div>

    <!-- FOR UPLOADING NEW PICTURE -->
    <div
      v-else
      class="w-1/2 mb-5 flex justify-center items-center border rounded border-blue-700 bg-blue-700 hover:bg-blue-800 hover:border-blue-800 cursor-pointer"
      style="padding: 10px; height: 40px"
    >
      <label
        class="1/2 flex justify-center items-center text-center text-white cursor-pointer"
        for="single"
      >
        {{ uploading ? "Uploading ..." : "Add image" }}
      </label>
      <input
        style="
          visibility: hidden;
          position: absolute;
          height: 100%;
          width: 100%;
        "
        type="file"
        id="single"
        accept="image/*"
        @change="uploadPostImage"
        :disabled="uploading"
      />
    </div>
  </div>
</template>
