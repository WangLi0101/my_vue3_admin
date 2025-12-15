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
    }
  ]
};
