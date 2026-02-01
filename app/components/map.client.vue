<script setup>
import { CENTER_USA } from "~/lib/constants";

const colorMode = useColorMode();

const style = computed(() =>
  colorMode.value === "dark"
    ? "/styles/dark.json"
    : "https://tiles.openfreemap.org/styles/liberty");
const center = CENTER_USA;
const zoom = 3;
</script>

<template>
  <MglMap
    :map-style="style"
    :center="center"
    :zoom="zoom"
  >
    <MglNavigationControl />
  </MglMap>
</template>
