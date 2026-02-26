<template>
  <div class="w-full h-full">
    <div :id="props.id" class="w-full h-full" />
  </div>
</template>

<script setup lang="ts">
import { getConfig, OnlineOfficeConfig } from "@/api/onlineOffice";
import { onMounted, onUnmounted, ref } from "vue";
interface Props {
  fileId: string;
  id?: string;
}
const props = withDefaults(defineProps<Props>(), {
  id: "placeholder"
});
const config = ref<OnlineOfficeConfig>();
let docEditor: any = null;

const getOfficeConfig = async () => {
  const res = await getConfig(props.fileId);
  config.value = res;
};

const loadScript = (url: string) => {
  return new Promise((resolve, reject) => {
    // 1. 如果全局对象已存在，直接返回
    if (window.DocsAPI) {
      resolve(window.DocsAPI);
      return;
    }

    // 2. 检查 DOM 中是否已有该 script 标签（防止快速切换页面时重复插入）
    // 注意：如果是快速切换，可能 script 还在 loading 中
    const existingScript = document.querySelector(`script[src="${url}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.DocsAPI));
      existingScript.addEventListener("error", err => reject(err));
      return;
    }

    // 3. 首次加载
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = url;
    script.async = true;
    script.onload = () => resolve(window.DocsAPI);
    script.onerror = error => reject(error);
    document.head.appendChild(script);
  });
};

const initEditor = async () => {
  if (!config.value) return;
  const { documentServerUrl, document, documentType, editorConfig, token } =
    config.value;
  const scriptUrl = `${documentServerUrl}/web-apps/apps/api/documents/api.js`;
  try {
    await loadScript(scriptUrl);
    if (window.DocsAPI) {
      docEditor = new window.DocsAPI.DocEditor(props.id, {
        document,
        documentType,
        editorConfig,
        token
      });
    }
  } catch (error) {
    // console.error("Failed to load OnlyOffice script:", error);
  }
};

onMounted(async () => {
  if (!props.fileId) return;
  await getOfficeConfig();
  await initEditor();
});

onUnmounted(() => {
  if (docEditor) {
    docEditor.destroyEditor();
    docEditor = null;
  }
});
</script>
