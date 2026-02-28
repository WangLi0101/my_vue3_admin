// 最简代码，也就是这些字段必须有
export default {
  path: "/ruleset",
  meta: {
    title: "规则引擎",
    icon: "material-symbols-light:rule-folder-outline",
    rank: 0
  },
  children: [
    {
      path: "/ruleset/editor",
      name: "rulesetEditor",
      component: () => import("@/views/ruleset/editor/index.vue"),
      meta: {
        title: "编辑器",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    }
  ]
};
