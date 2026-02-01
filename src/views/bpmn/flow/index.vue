<template>
  <div class="flow-designer flex flex-col h-full bg-gray-50 box-border">
    <!-- Header Toolbar -->
    <div
      class="header h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10 shrink-0"
    >
      <div class="left flex items-center gap-3">
        <span class="text-lg font-bold text-gray-800 tracking-tight"
          >工作流设计器</span
        >
        <el-tag size="small" effect="plain" round class="!text-xs !px-2"
          >BPMN 2.0</el-tag
        >
      </div>
      <div class="right">
        <el-button
          type="primary"
          class="!px-6 !font-medium shadow-sm hover:shadow-md transition-shadow"
          @click="save"
        >
          保存流程
        </el-button>
      </div>
    </div>

    <!-- Main Content -->
    <div class="content flex-1 flex overflow-hidden relative">
      <!-- Palette -->
      <Palette :modeler="modelerInstance" />

      <!-- Canvas -->
      <div
        id="bpmn-flow"
        ref="canvasRef"
        class="flex-1 h-full bg-[#f8fafc] w-full"
      />

      <!-- Properties Panel -->
      <div
        class="properties-panel w-[360px] h-full bg-white border-l border-gray-200 shadow-xl z-20 flex flex-col"
      >
        <ConfigPanel v-if="modelerInstance" :modeler="modelerInstance" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BpmnModeler from "bpmn-js/lib/Modeler";
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import flowableModdleDescriptor from "./utils/flowable.json";
import leaveApprovalXml from "./utils/leaveApproval.xml?raw";
import ConfigPanel from "./components/ConfigPanel.vue";
import Palette from "./components/Palette.vue";

import { onBeforeUnmount, onMounted, ref, shallowRef } from "vue";

let modeler: BpmnModeler | null = null;
const canvasRef = ref<HTMLElement | null>(null);
const modelerInstance = shallowRef<BpmnModeler | null>(null);

onMounted(() => {
  init();
});

const init = () => {
  modeler = new BpmnModeler({
    container: "#bpmn-flow",
    moddleExtensions: {
      flowable: flowableModdleDescriptor
    }
  });

  modelerInstance.value = modeler;

  modeler.importXML(leaveApprovalXml);
};

const save = async () => {
  if (!modeler) return;
  const { xml } = await modeler.saveXML({ format: true });
  console.log(xml);
};

onBeforeUnmount(() => {
  modeler?.destroy();
});
</script>

<style lang="scss" scoped>
.flow-designer {
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    sans-serif;
}

#bpmn-flow {
  /* Dot grid pattern */
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 20px 20px;
}
</style>

<style>
/* Hide default bpmn-js palette */
.djs-palette {
  display: none !important;
}
</style>
