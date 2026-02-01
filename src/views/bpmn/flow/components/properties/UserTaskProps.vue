<template>
  <el-form ref="formRef" :model="formData" label-position="top">
    <div class="group-box mb-8">
      <div
        class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-orange-500 rounded-full" />
        任务配置
      </div>
      <el-form-item label="办理人" prop="assignee">
        <template #label
          ><span class="text-gray-600">办理人 (Assignee)</span></template
        >
        <el-input v-model="formData.assignee" placeholder="指定办理人..." />
      </el-form-item>
      <el-form-item prop="candidateUsers">
        <template #label
          ><span class="text-gray-600"
            >候选用户 (Candidate Users)</span
          ></template
        >
        <el-input
          v-model="formData.candidateUsers"
          placeholder="逗号分隔用户..."
        />
      </el-form-item>
      <el-form-item prop="candidateGroups">
        <template #label
          ><span class="text-gray-600"
            >候选组 (Candidate Groups)</span
          ></template
        >
        <el-input
          v-model="formData.candidateGroups"
          placeholder="逗号分隔组..."
        />
      </el-form-item>
      <div class="grid grid-cols-2 gap-3">
        <el-form-item label="到期时间" prop="dueDate">
          <el-input v-model="formData.dueDate" placeholder="ISO 8601..." />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input v-model="formData.priority" placeholder="数值..." />
        </el-form-item>
      </div>
      <el-form-item label="跳过表达式" prop="skipExpression">
        <el-input v-model="formData.skipExpression" placeholder="${skip}" />
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
  assignee: "",
  candidateUsers: "",
  candidateGroups: "",
  dueDate: "",
  priority: "",
  skipExpression: ""
});

const initData = () => {
  if (!props.element) return;
  const bo = props.element.businessObject;
  Object.keys(formData.value).forEach(key => {
    // @ts-ignore
    formData.value[key] = bo[key] || "";
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
        resolve({ ...formData.value });
      } else {
        reject(new Error("任务配置验证失败"));
      }
    });
  });
};

defineExpose({
  getProperties
});
</script>
