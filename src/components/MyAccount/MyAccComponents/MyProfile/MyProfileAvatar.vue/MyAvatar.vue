<script setup>
import { ref, toRefs, watch } from "vue";
import { supabase } from "../../../../../connections/supabase";

const prop = defineProps(["path"]);
const { path } = toRefs(prop);

const emit = defineEmits(["upload", "update:path"]);
const uploading = ref(false);
const src = ref("");
const files = ref();

const downloadImage = async () => {
  try {
    const { data, error } = await supabase.storage
      .from("avatars")
      .download(path.value);
    if (error) throw error;
    src.value = URL.createObjectURL(data);
  } catch (error) {
    console.error("Error downloading image: ", error.message);
  }
};

const uploadAvatar = async (evt) => {
  files.value = evt.target.files;
  try {
    uploading.value = true;
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
      .from("avatars")
      .upload(filePath, file);

    if (uploadError) throw uploadError;
    emit("update:path", filePath);
    emit("upload");
  } catch (error) {
    alert(error.message);
  } finally {
    uploading.value = false;
  }
};

watch(
  path,
  () => {
    if (path.value) downloadImage();
  },
  { immediate: true }
);
</script>

<template>
  <div class="flex flex-col justify-center items-center my-3">
    <img
      v-if="src"
      :src="src"
      alt="Avatar"
      class="w-40 h-40 rounded-full object-scale-down"
    />
    <l-grid v-else size="70" speed="1.5" color="black" class="my-4"></l-grid>

    <div class="relative" :style="{ width: size + 'em' }">
      <label
        class="button primary block cursor-pointer w-full text-center"
        for="single"
      >
        {{ uploading ? "Uploading ..." : "Upload" }}
      </label>
      <input
        style="
          opacity: 0;
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 100%;
          cursor: pointer;
        "
        type="file"
        id="single"
        accept="image/*"
        @change="uploadAvatar"
        :disabled="uploading"
      />
    </div>
  </div>
</template>
