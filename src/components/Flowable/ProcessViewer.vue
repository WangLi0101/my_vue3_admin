<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import BpmnViewer from "bpmn-js/lib/Viewer";
import {
  getProcessDefinitionXML,
  getProcessActiveActivityIds
} from "@/api/flowable";

const props = defineProps<{
  processDefinitionId?: string;
  processInstanceId?: string;
  xml?: string;
}>();

const container = ref<HTMLElement | null>(null);
let viewer: any = null;

const fetchAndRender = async () => {
  if (!container.value) return;

  // 1. 获取XML
  let xml = props.xml;
  if (!xml && props.processDefinitionId) {
    xml = await getProcessDefinitionXML(props.processDefinitionId);
  }

  if (!xml) return;

  // 2. 渲染流程图
  if (!viewer) {
    viewer = new BpmnViewer({
      container: container.value
    });
  }

  try {
    await viewer.importXML(xml);

    // 3. 高亮处理
    if (props.processInstanceId) {
      const activeActivityIds = await getProcessActiveActivityIds(
        props.processInstanceId
      );
      const canvas = viewer.get("canvas");

      // 清除旧的高亮 (如果在这个组件复用的情况下)
      // ... (省略复杂的清除逻辑，简单场景重绘即可)

      if (activeActivityIds && activeActivityIds.length > 0) {
        activeActivityIds.forEach((id: string) => {
          canvas.addMarker(id, "highlight");
        });
      }
    }

    // 自适应缩放
    const canvas = viewer.get("canvas");
    canvas.zoom("fit-viewport");
  } catch (err) {
    console.error("could not import BPMN 2.0 diagram", err);
  }
};

onMounted(() => {
  fetchAndRender();
});

watch(
  () => props.processInstanceId,
  () => {
    fetchAndRender(); // 简单粗暴重绘，确保状态最新
  }
);
</script>

<template>
  <div ref="container" class="bpmn-container" />
</template>

<style>
.bpmn-container {
  width: 100%;
  height: 400px;
  background-color: #fff;
  border: 1px solid #ddd;
}

/* 高亮样式 */
.highlight:not(.djs-connection) .djs-visual > :nth-child(1) {
  fill: rgb(0 128 0 / 20%) !important;
  stroke: green !important;
  stroke-width: 2px !important;
}
</style>
