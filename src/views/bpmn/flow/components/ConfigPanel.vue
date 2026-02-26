<template>
  <div class="config-panel h-full flex flex-col bg-white">
    <!-- Panel Header -->
    <div
      class="panel-header px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0"
    >
      <span class="font-bold text-gray-700 text-sm">属性配置</span>
      <div v-if="selectedElement" class="flex items-center gap-2">
        <span class="text-xs text-gray-400 font-mono mr-2"
          >{{ selectedElement.id?.substring(0, 15) }}...</span
        >
        <el-button type="primary" size="small" @click="handleSave"
          >保存</el-button
        >
      </div>
    </div>

    <!-- Scrollable Content -->
    <div
      v-if="selectedElement"
      class="panel-content flex-1 overflow-y-auto custom-scrollbar p-5"
    >
      <div class="workflow-form">
        <!-- Common Properties -->
        <CommonProps
          ref="commonPropsRef"
          :modeler="modeler"
          :element="selectedElement"
        />

        <!-- Specific Properties (Dynamic Component) -->
        <component
          :is="specificComponent"
          v-if="specificComponent"
          ref="specificPropsRef"
          :modeler="modeler"
          :element="selectedElement"
        />

        <!-- Multi-instance -->
        <MultiInstanceProps
          v-if="showMultiInstance"
          ref="multiInstancePropsRef"
          :modeler="modeler"
          :element="selectedElement"
        />
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30"
    >
      <div
        class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-500">未选择元素</p>
      <p class="text-xs text-gray-400 mt-1">点击画布中的节点以配置其属性</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, type Component, useTemplateRef } from "vue";
import { ElMessage } from "element-plus";
import BpmnModeler from "bpmn-js/lib/Modeler";
import CommonProps from "./properties/CommonProps.vue";
import UserTaskProps from "./properties/UserTaskProps.vue";
import SequenceFlowProps from "./properties/SequenceFlowProps.vue";
import ServiceTaskProps from "./properties/ServiceTaskProps.vue";
import MultiInstanceProps from "./properties/MultiInstanceProps.vue";

interface Props {
  modeler: BpmnModeler;
}
const props = defineProps<Props>();

const selectedElement = ref<any>(null);

// Component Refs
const commonPropsRef =
  useTemplateRef<InstanceType<typeof CommonProps>>("commonPropsRef");
const specificPropsRef =
  useTemplateRef<InstanceType<typeof UserTaskProps>>("specificPropsRef");
const multiInstancePropsRef = useTemplateRef<
  InstanceType<typeof MultiInstanceProps>
>("multiInstancePropsRef");

// Component Mapping
const componentMap: Record<string, Component> = {
  "bpmn:UserTask": UserTaskProps,
  "bpmn:SequenceFlow": SequenceFlowProps,
  "bpmn:ServiceTask": ServiceTaskProps
};

const elementType = computed(() => {
  if (!selectedElement.value) return "";
  return (
    selectedElement.value.type ||
    selectedElement.value.businessObject?.$type ||
    ""
  );
});

// Dynamic component for specific properties
const specificComponent = computed(() => {
  return componentMap[elementType.value] || null;
});

// Logic to determine if MultiInstance props should be shown
const showMultiInstance = computed(() => {
  const type = elementType.value;
  return ["bpmn:UserTask", "bpmn:ServiceTask", "bpmn:SubProcess"].includes(
    type
  );
});

onMounted(() => {
  if (props.modeler) {
    props.modeler.on("selection.changed", (e: any) => {
      const selection = e.newSelection;
      if (selection && selection.length === 1) {
        selectedElement.value = selection[0];
      } else {
        selectedElement.value = null;
      }
    });

    // Optional: Listen for element changes that might affect type (rare, but good practice)
    props.modeler.on("element.changed", (e: any) => {
      if (selectedElement.value && e.element.id === selectedElement.value.id) {
        // Force update if needed, typically reactivity handles it via ref
      }
    });
  }
});

const handleSave = async () => {
  if (!selectedElement.value) return;

  const modeling = props.modeler.get("modeling") as any;
  const propertyPromises: Promise<any>[] = [];

  // Collect property promises from all active forms
  if (commonPropsRef.value)
    propertyPromises.push(commonPropsRef.value.getProperties());
  if (specificPropsRef.value)
    propertyPromises.push(specificPropsRef.value.getProperties());
  if (multiInstancePropsRef.value)
    propertyPromises.push(multiInstancePropsRef.value.getProperties());

  try {
    // Wait for all forms to validate and return their properties
    const results = await Promise.all(propertyPromises);

    // Aggregate properties
    const properties = Object.assign({}, ...results);

    // Update BPMN model
    modeling.updateProperties(selectedElement.value, properties);
    ElMessage.success("保存成功");
  } catch (error) {
    console.error(error);
    ElMessage.warning("请检查表单填写是否正确");
  }
};
</script>

<style scoped lang="scss">
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #4b5563; /* text-gray-600 */
}
</style>
