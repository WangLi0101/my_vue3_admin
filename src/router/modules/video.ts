// 最简代码，也就是这些字段必须有
export default {
  path: "/video",
  meta: {
    title: "视频处理",
    icon: "ep:video-play",
    rank: 0
  },
  children: [
    {
      path: "/video/player",
      name: "Player",
      component: () => import("@/views/video/player/index.vue"),
      meta: {
        title: "视频播放器",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    },
    {
      path: "/video/image",
      name: "Image",
      component: () => import("@/views/video/image/index.vue"),
      meta: {
        title: "图片处理",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    },
    {
      path: "/video/faceDiff",
      name: "FaceDiff",
      component: () => import("@/views/video/faceDiff/index.vue"),
      meta: {
        title: "人脸对比",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    }
  ]
};
