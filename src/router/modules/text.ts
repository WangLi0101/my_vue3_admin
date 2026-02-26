// 最简代码，也就是这些字段必须有
export default {
  path: "/text",
  meta: {
    title: "文本处理",
    icon: "ep:video-play",
    rank: 0
  },
  children: [
    {
      path: "/text/diff",
      name: "textDiff",
      component: () => import("@/views/text/diff/index.vue"),
      meta: {
        title: "文本对比",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    }
  ]
};
