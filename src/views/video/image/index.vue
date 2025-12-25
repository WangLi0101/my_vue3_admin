<template>
  <div class="image-transform">
    <el-upload
      class="avatar-uploader"
      action="#"
      :http-request="handleUpload"
      :show-file-list="false"
    >
      <img v-if="imageUrl" :src="imageUrl" class="avatar" />
      <el-icon v-else class="avatar-uploader-icon">
        <Plus />
      </el-icon>
    </el-upload>
    <img v-if="newImageUrl" :src="newImageUrl" class="avatar" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { UploadRequestOptions } from "element-plus";
import { Plus } from "@element-plus/icons-vue";

const imageUrl = ref<string>("");
const newImageUrl = ref("");

const worker = new Worker(
  new URL("../../../worker/image.worker.ts", import.meta.url),
  {
    type: "module"
  }
);

// 接收 Worker 处理后的 Blob
worker.onmessage = (e: { data: { blob: Blob } }) => {
  const { blob } = e.data;
  // 释放旧的 URL
  if (newImageUrl.value) {
    URL.revokeObjectURL(newImageUrl.value);
  }
  newImageUrl.value = URL.createObjectURL(blob);
};

const handleUpload = async (options: UploadRequestOptions) => {
  const { file } = options;
  imageUrl.value = URL.createObjectURL(file);

  // 创建 ImageBitmap（可转移对象）
  const imageBitmap = await createImageBitmap(file);

  // 直接传输 ImageBitmap 到 Worker，所有 Canvas 操作在 Worker 中完成
  worker.postMessage({ imageBitmap }, [imageBitmap]);
};

onBeforeUnmount(() => {
  worker.terminate();
});
</script>

<style lang="scss" scoped>
.avatar-uploader .avatar {
  width: 178px;
  height: 178px;
  display: block;
}
</style>

<style>
.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  text-align: center;
}
</style>
