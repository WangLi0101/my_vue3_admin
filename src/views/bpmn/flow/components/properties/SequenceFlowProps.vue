<template>
  <el-form ref="formRef" :model="formData" label-position="top">
    <div class="group-box mb-8">
      <div
        class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-green-500 rounded-full" />
        流转条件
      </div>
      <el-form-item label="条件表达式" prop="conditionExpression">
        <el-input
          v-model="formData.conditionExpression"
          type="textarea"
          :rows="2"
          placeholder="${condition}"
        />
      </el-form-item>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch, useTemplateRef } from "vue";
import BpmnModeler from "bpmn-js/lib/Modeler";

interface Props {
  modeler: BpmnModeler;
  element: any;
}
const props = defineProps<Props>();
const formRef = useTemplateRef("formRef");

const formData = ref({
  conditionExpression: ""
});

const initData = () => {
  if (!props.element) return;
  const bo = props.element.businessObject;
  Object.keys(formData.value).forEach(key => {
    if (key === "conditionExpression") {
      formData.value.conditionExpression = bo.conditionExpression?.body || "";
    }
  });
};

watch(
  () => props.element,
  () => {
    initData();
  },
  { immediate: true }
);

const getProperties = () => {
  return new Promise((resolve, reject) => {
    formRef.value.validate((valid: boolean) => {
      if (valid) {
        const properties: any = {};
        if (formData.value.conditionExpression) {
          const moddle = props.modeler.get("moddle") as any;
          properties.conditionExpression = moddle.create(
            "bpmn:FormalExpression",
            {
              body: formData.value.conditionExpression
            }
          );
        } else {
          properties.conditionExpression = undefined;
        }
        resolve(properties);
      } else {
        reject(new Error("流转条件验证失败"));
      }
    });
  });
};

defineExpose({
  getProperties
});
</script>
