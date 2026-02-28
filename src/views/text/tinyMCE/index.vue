<template>
  <div>
    <TinyMceEditor id="tinymce-editor" v-model="content" :height="600" />
    <p>{{ content }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import TinyMceEditor from "./components/TinyMceEditor.vue";

const content = ref("");
</script>
