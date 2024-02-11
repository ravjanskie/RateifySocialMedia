<template>
  <section class="w-full min-h-screen flex flex-col gradient-body">
    <nav class="flex items-center space-x-2 p-4">
      <img class="h-8 w-8 md:h-10 md:w-10" :src="RateifyLogo" />
      <h1 class="text-xl font-semibold text-black">Rateify</h1>
    </nav>

    <div
      class="w-screen flex justify-center items-center px-4 md:px-6 flex-1"
    >
      <div class="flex flex-col justify-center items-center space-y-4 text-center p-4 md:w-3/4">
        <h1 class="text-3xl md:text-5xl font-bold tracking-lighter">
          A
          <span class="gradient-text-background1"> Community-Driven </span>
          Minimalist Social Platform for Rating Anything and Everything
        </h1>
        <h3 class="text-base md:text-lg font-bold tracking-lighter my-10">
          <span class="gradient-text-background2"> share your opinions </span>
          with your ratings and
          <span class="gradient-text-background3"
            >let the ratings do the talking
          </span>
        </h3>
        <RouterLink to="/login">
          <button class="join">
            <span>Join Our Community</span>
            <div class="liquid"></div>
          </button>
        </RouterLink>
      </div>

    </div>

    <div class="video-container">
      <video autoplay loop muted class="video">
        <source :src="backgroundVideo" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
  </section>
</template>

<script setup>
import "../assets/main.css";
import RateifyLogo from "../assets/RateifyLogoBlack.svg";

</script>

<style scoped>
.gradient-text-background1 {
  background: linear-gradient(
    to right,
    #ffcc00 20%,
    #66ff00  30%, 
    #FFF78A 70%, 
    #11009E 80% 
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 500% auto;
  animation: textShine 5s ease-in-out infinite alternate;
}

.gradient-text-background2 {
  background: linear-gradient(
    to right,
    #11009E 20%,
    #5f0f40 30%,
    #ffcc00 70%,
    #66ff00 80%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 500% auto;
  animation: textShine 5s ease-in-out infinite alternate;
}
.gradient-text-background3 {
  background: linear-gradient(
    to right,
    #5f0f40 20%,
    #11009E 30%,
    #66ff00 70%,
    #ffcc00 80%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 500% auto;
  animation: textShine 5s ease-in-out infinite alternate;
}

@keyframes textShine {
  0% {
    background-position: 0% 50%;
  }
  100% {
    background-position: 100% 50%;
  }
}

.join {
  font: 700 10px consolas;
  color: #fff;
  text-decoration: none;
  text-transform: uppercase;
  padding: 10px 30px;
  margin-top: 20px;
  margin-bottom: 10px;
  position: relative;
  overflow: hidden;
  border-radius: 5px;
  transition: 0.2s;
  transform: scale(2);
}

.join span {
  position: relative;
  z-index: 0;
  color: #fff;
}

.join .liquid {
  position: absolute;
  top: -60px;
  left: 0;
  width: 100%;
  height: 200px;
  background: #7293ff;
  box-shadow: inset 0 0 50px rgba(0, 0, 0, 0.7);
  z-index: -1;
  transition: 0.6s;
}

.join .liquid::after,
.join .liquid::before {
  position: absolute;
  content: "";
  width: 200%;
  height: 200%;
  top: 0;
  left: 0;
  transform: translate(-25%, -75%);
}

.join .liquid::after {
  border-radius: 45%;
  background: rgba(20, 20, 20, 1);
  box-shadow: 0 0 10px 5px #7293ff, inset 0 0 5px #7293ff;
  animation: animate 5s linear infinite;
  opacity: 0.8;
}

.join .liquid::before {
  border-radius: 40%;
  box-shadow: 0 0 10px rgba(26, 26, 26, 0.5),
    inset 0 0 5px rgba(26, 26, 26, 0.5);
  background: rgba(26, 26, 26, 0.5);

  animation: animate 7s linear infinite;
}

@keyframes animate {
  0% {
    transform: translate(-25%, -75%) rotate(0);
  }
  100% {
    transform: translate(-25%, -75%) rotate(360deg);
  }
}
.join:hover .liquid {
  top: -120px;
}

.join:hover {
  box-shadow: 0 0 5px #7293ff, inset 0 0 5px #7293ff;
  transition-delay: 0.2s;
}
</style>
