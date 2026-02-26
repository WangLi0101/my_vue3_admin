// 最简代码，也就是这些字段必须有
export default {
  path: "/bmpn",
  meta: {
    title: "bmpn",
    icon: "ep:video-play",
    rank: 0
  },
  children: [
    {
      path: "/bpmn/flow",
      name: "BmpnFlow",
      component: () => import("@/views/bpmn/flow/index.vue"),
      meta: {
        title: "流程设计器",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    }
  ]
};
