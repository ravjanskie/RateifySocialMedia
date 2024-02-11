<template>
  <div class="scanner-container">
    <h1>QR Scanner</h1>
    <div class="scanner">
      <QrcodeStream @detect="onDetect" @error="onError" class="gradient-body" />
    </div>
    <p class="error">{{ error }}</p>
    <p class="decode-result">
      Last result: <b>{{ result }}</b>
    </p>
  </div>
</template>

<script setup lang="ts">
import "../../assets/main.css";
import { ref } from "vue";
import { QrcodeStream } from "vue-qrcode-reader";

const result = ref("");
const error = ref("");

const onDetect = (detectedCodes) => {
  console.log(detectedCodes);

  const [firstCode] = detectedCodes;

  if (firstCode) {
    result.value = firstCode.rawValue;

    try {
      window.location.href = result.value;
    } catch (error) {
      console.error(error);
    }
  } else {
    error.value = "No QR code detected";
  }
};

const onError = (err) => {
  error.value = `[${err.name}]: `;

  if (err.name === "NotAllowedError") {
    error.value += "you need to grant camera access permission";
  } else if (err.name === "NotFoundError") {
    error.value += "no camera on this device";
  } else if (err.name === "NotSupportedError") {
    error.value += "secure context required (HTTPS, localhost)";
  } else if (err.name === "NotReadableError") {
    error.value += "is the camera already in use?";
  } else if (err.name === "OverconstrainedError") {
    error.value += "installed cameras are not suitable";
  } else if (err.name === "StreamApiNotSupportedError") {
    error.value += "Stream API is not supported in this browser";
  } else if (err.name === "InsecureContextError") {
    error.value +=
      "Camera access is only permitted in secure context. Use HTTPS or localhost rather than HTTP.";
  } else {
    error.value += err.message;
  }
};
</script>

<style scoped>
.scanner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
}

.scanner {
  width: 300px;
  height: 300px;
  border: 3px solid #333;
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.error {
  font-weight: bold;
  color: red;
}

.decode-result {
  margin: 10px;
}
</style>
