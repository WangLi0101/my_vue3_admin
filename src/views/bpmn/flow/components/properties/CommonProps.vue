<template>
  <el-form ref="formRef" :model="formData" label-position="top">
    <div class="group-box mb-8">
      <div
        class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-blue-500 rounded-full" />
        常规信息
      </div>

      <div class="grid gap-1">
        <el-form-item label="ID 标识" prop="id">
          <el-input v-model="formData.id" placeholder="请输入唯一标识" />
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入节点名称" />
        </el-form-item>
        <el-form-item label="描述文档" prop="documentation">
          <el-input
            v-model="formData.documentation"
            type="textarea"
            :rows="3"
            resize="none"
            placeholder="请输入节点描述..."
          />
        </el-form-item>
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch, useTemplateRef } from "vue";
import BpmnModeler from "bpmn-js/lib/Modeler";

interface Props {
  modeler: BpmnModeler;
  element: BpmnElement;
}
const props = defineProps<Props>();
const formRef = useTemplateRef("formRef");

const formData = ref({
  id: "",
  name: "",
  documentation: ""
});

const initData = () => {
  if (!props.element) return;
  const bo = props.element.businessObject;

  Object.keys(formData.value).forEach(key => {
    if (key === "documentation") {
      formData.value[key] = bo.documentation?.[0]?.text || "";
    } else {
      formData.value[key] = bo[key] || "";
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
        const properties: any = {
          id: formData.value.id,
          name: formData.value.name
        };

        if (formData.value.documentation) {
          const bpmnFactory = props.modeler.get("bpmnFactory") as any;
          const doc = bpmnFactory.create("bpmn:Documentation", {
            text: formData.value.documentation
          });
          properties.documentation = [doc];
        } else {
          properties.documentation = undefined;
        }
        resolve(properties);
      } else {
        reject(new Error("常规信息验证失败"));
      }
    });
  });
};

defineExpose({
  getProperties
});
</script>
