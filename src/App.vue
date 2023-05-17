<template>
  <div class="container"><Map /></div>
</template>

<script setup lang="ts">
import Map from "./views/map/map.vue";
</script>

<style scoped>
header {
  line-height: 1.5;
}

.logo {
  display: block;
  margin: 0 auto 2rem;
}
.container {
  position: relative;
  width: 100vw;
  height: 100vh;
}
</style>
