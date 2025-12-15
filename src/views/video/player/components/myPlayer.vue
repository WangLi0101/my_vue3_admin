<template>
  <div class="my-player">
    <div class="top">
      <div class="video">
        <video :id="id" style="width: 100%; height: 100%" />
      </div>
      <div v-show="isMask" class="mask">暂无视频</div>
    </div>
    <div class="list mt-5">
      <el-table
        :data="props.videoList"
        ref="singleTableRef"
        @current-change="handleCurrentChange"
        highlight-current-row
      >
        <el-table-column type="index" label="#" width="40" align="center" />
        <el-table-column prop="date" label="开始时间">
          <template v-slot="scope">
            {{ formatTime(scope.row.startedAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="date" label="结束时间">
          <template v-slot="scope">
            {{ formatTime(scope.row.startedAt + scope.row.duration) }}
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import TCPlayer from "tcplayer.js";
import "tcplayer.js/dist/tcplayer.min.css";

import dayjs from "dayjs";
import { ElTable } from "element-plus";
import { onMounted, onUnmounted, ref } from "vue";
interface VideoItem {
  url: string;
  startedAt: number;
  duration: number;
  type: string;
}
interface Props {
  id: string;
  videoList: VideoItem[];
}
const props = defineProps<Props>();
const singleTableRef = ref<InstanceType<typeof ElTable>>();

onMounted(() => {
  initPlayer();
});
onUnmounted(() => {
  player && player.dispose();
});

const formatTime = (time: number) => {
  return dayjs(time * 1000).format("HH:mm:ss");
};

const isMask = ref(false);
let player: any = null;

// 初始化播放器
const initPlayer = async () => {
  player = TCPlayer(props.id, {
    autoplay: false
  });
  player.src(props.videoList[0].url);

  // 切换播放源
  player.on("loadedmetadata", () => {
    if (isJumpTo.value) {
      player.currentTime(justToTime.value);
    }
    if (!isReset.value) {
      player.play();
    }
  });
};
// 表格点击
const handleCurrentChange = (item: VideoItem) => {
  isMask.value = false;
  isReset.value = false;
  player.src(item.url);
};

// 设置表格选中
const selectRow = () => {
  const res = props.videoList.find(item => item.url === currentUrl.value);
  res && singleTableRef.value?.setCurrentRow(res);
};

// 跳转到指定时间
const isJumpTo = ref(false);
const justToTime = ref(0);
const jumpTo = (url: string | undefined, time: number) => {
  if (!url) {
    isMask.value = true;
    player.pause();
    return;
  }
  isReset.value = false;
  currentUrl.value = url;
  selectRow();
  isJumpTo.value = true;
  justToTime.value = time;
  isMask.value = false;
  player.src(url);
};

// 指定url播放,不跳转
const currentUrl = ref("");
const normalPlay = (url: string) => {
  selectRow();
  isReset.value = false;
  currentUrl.value = url;
  isJumpTo.value = false;
  isMask.value = false;
  player.src(url);
};

const stop = () => {
  player.pause();
};

const isReset = ref(true);
const reset = () => {
  isReset.value = true;
  isMask.value = false;
  isJumpTo.value = false;
  player.pause();
  currentUrl.value = props.videoList[0].url;
  player.src(currentUrl.value);
};
defineExpose({
  jumpTo,
  normalPlay,
  stop,
  reset
});
</script>

<style lang="scss" scoped>
.top {
  position: relative;

  .video {
    box-sizing: content-box;
    width: 300px;
    height: 200px;
  }

  .mask {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;
    width: 100%;
    height: 100%;
    line-height: 400px;
    text-align: center;
    background-color: #ccc;
  }
}
</style>
