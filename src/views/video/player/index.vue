<template>
  <div class="basel">
    <div class="control">
      <div class="flex items-center">
        <p>{{ getStartedAt() }}</p>
        <div class="mx-8 flex-1">
          <el-slider
            v-model="progress"
            :min="min()"
            :max="max()"
            :format-tooltip="formatTooltip"
            @change="slideChange"
          />
        </div>
        <p>{{ endAt() }}</p>
      </div>
      <div class="bottom">
        <el-tooltip
          class="item"
          effect="dark"
          content="重置"
          placement="top-start"
        >
          <div class="back" @click="reset" />
        </el-tooltip>
        <el-tooltip
          class="item"
          effect="dark"
          content="开始播放"
          placement="top-start"
        >
          <div v-show="!isPlaying" class="stop" @click="start" />
        </el-tooltip>
        <el-tooltip
          class="item"
          effect="dark"
          content="暂停播放"
          placement="top-start"
        >
          <div v-show="isPlaying" class="start" @click="stop">
            <span />
            <span />
          </div>
        </el-tooltip>
      </div>
    </div>
    <div class="list flex justify-between mt-5">
      <div class="item" v-for="(item, key) in videoList" :key="key">
        <MyPlayer :video-list="item" :id="key" :ref="el => getRef(key, el)" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from "dayjs";
import { computed, ref, watch } from "vue";
import MyPlayer from "./components/myPlayer.vue";
interface VideoItem {
  url: string;
  startedAt: number;
  duration: number;
  type: string;
}
const videoObj = {
  mobileVideoUrlList: [
    {
      url: "https://1500009070.vod2.myqcloud.com/6c9c6118vodcq1500009070/7995e0321253642696948254188/playlist_eof.m3u8",
      startedAt: 1715493915,
      duration: 8706,
      type: "m3u8"
    },
    {
      url: "https://1500009070.vod2.myqcloud.com/6c9c6118vodcq1500009070/1f171eab1253642696893142564/playlist_eof.m3u8",
      startedAt: 1715419559,
      duration: 46,
      type: "m3u8"
    }
  ],
  cameraMonitorUrlList: [
    {
      url: "https://1500009070.vod2.myqcloud.com/6c9c6118vodcq1500009070/81e82b511253642696962156883/playlist_eof.m3u8",
      startedAt: 1715495421,
      duration: 7209,
      type: "m3u8"
    }
  ],
  screenMonitorUrlList: [
    {
      url: "https://1500009070.vod2.myqcloud.com/6c9c6118vodcq1500009070/8427f56d1253642696962240984/playlist_eof.m3u8",
      startedAt: 1715495440,
      duration: 7189,
      type: "m3u8"
    }
  ],
  startedAt: "2024-05-12T06:30:13.497+00:00",
  finishedAt: "2024-05-12T08:30:17.549+00:00"
};
// playerRef
const playerRef = ref<any>({});
const getRef = (key: string, el: any) => {
  if (el) {
    playerRef.value[key] = el;
  }
};
const videoList = computed(() => {
  const { startedAt: _startedAt, finishedAt: _finishedAt, ...data } = videoObj;
  return data;
});
// 开始时间
const getStartedAt = () => {
  return dayjs(videoObj.startedAt).format("HH:mm:ss");
};
// 结束时间
const endAt = () => {
  return dayjs(videoObj.finishedAt).format("HH:mm:ss");
};
const min = () => {
  return dayjs(videoObj.startedAt).unix();
};
const max = () => {
  return dayjs(videoObj.finishedAt).unix();
};
const formatTooltip = (value: number) => {
  return dayjs(value * 1000).format("HH:mm:ss");
};

// 定时器
let timer: null | number = null;
const startTimer = () => {
  timer && clearInterval(timer);
  timer = window.setInterval(() => {
    progress.value += 1;
  }, 1000);
};
const clearTimer = () => {
  timer && clearInterval(timer);
};

const progress = ref(0);
const isPlaying = ref(false);
// 开始播放
const start = () => {
  isPlaying.value = true;
  startTimer();
  // 找到时间点对应的视频
  for (const key in videoList.value) {
    const video = findTimeVideo(
      videoList.value[key as keyof typeof videoList.value]
    );

    playerRef.value[key].jumpTo(video?.url, fastSeconds(video));
  }
};
// 暂停播放
const stop = () => {
  isPlaying.value = false;
  clearTimer();
  for (const key in playerRef.value) {
    playerRef.value[key].stop();
  }
};

// 重置
const reset = () => {
  isPlaying.value = false;
  clearTimer();
  progress.value = min();
  for (const key in playerRef.value) {
    playerRef.value[key].reset();
  }
};

// 找到时间点对应的视频
const findTimeVideo = (list: VideoItem[]) => {
  const res = list.find(item => {
    return (
      progress.value >= item.startedAt &&
      progress.value <= item.startedAt + item.duration
    );
  });
  return res;
};

// 找到相等的时间点
const findEqualTimeVideo = (list: VideoItem[]) => {
  const res = list.find(item => {
    return progress.value === item.startedAt;
  });
  return res;
};

// 处理快进秒数
const fastSeconds = (videoItem: VideoItem | undefined) => {
  return videoItem ? progress.value - videoItem.startedAt : 0;
};

// 监听进度,找到对应的视频开始播放
watch(progress, newValue => {
  if (newValue !== min()) {
    // 找到时间点对应的视频
    for (const key in videoList.value) {
      const video = findEqualTimeVideo(
        videoList.value[key as keyof typeof videoList.value]
      );
      if (video) {
        playerRef.value[key].normalPlay(video.url);
      }
    }
  }
});

// 滑动条改变
const slideChange = () => {
  start();
};
</script>

<style lang="scss" scoped>
.control {
  .bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 24px;

    .back {
      width: 15px;
      height: 15px;
      margin-right: 15px;
      cursor: pointer;
      background-color: #676767;

      &:hover {
        background-color: #cb2a1d;
      }
    }

    .stop {
      width: 0;
      height: 0;
      cursor: pointer;
      border: 12px solid;
      border-color: transparent;
      border-left-color: #676767;

      &:hover {
        border-left-color: #cb2a1d;
      }
    }

    .start {
      display: flex;
      width: 24px;
      height: 24px;
      cursor: pointer;

      span {
        width: 5px;
        height: 20px;
        background-color: #676767;

        & + span {
          margin-left: 5px;
        }
      }

      &:hover {
        span {
          background-color: #cb2a1d;
        }
      }
    }
  }
}
</style>
