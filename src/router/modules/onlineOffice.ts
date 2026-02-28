// 最简代码，也就是这些字段必须有
export default {
  path: "/onlineOffice",
  meta: {
    title: "onlineOffice",
    icon: "material-symbols:local-post-office-outline",
    rank: 0
  },
  children: [
    {
      path: "/onlineOffice/word",
      name: "Word",
      component: () => import("@/views/onlineOffice/word/index.vue"),
      meta: {
        title: "Word",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    },
    {
      path: "/onlineOffice/pdf",
      name: "Pdf",
      component: () => import("@/views/onlineOffice/pdf/index.vue"),
      meta: {
        title: "Pdf",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    },
    {
      path: "/onlineOffice/excel",
      name: "Excel",
      component: () => import("@/views/onlineOffice/excel/index.vue"),
      meta: {
        title: "Excel",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    },
    {
      path: "/onlineOffice/ppt",
      name: "Ppt",
      component: () => import("@/views/onlineOffice/ppt/index.vue"),
      meta: {
        title: "PPT",
        // 通过设置showParent为true，显示父级
        showParent: true
      }
    }
  ]
};
