<template>
  <el-form ref="formRef" :model="formData" label-position="top">
    <div class="group-box mb-8">
      <div
        class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-purple-500 rounded-full" />
        服务配置
      </div>
      <el-form-item label="服务类型" prop="serviceType">
        <el-select v-model="formData.serviceType" class="w-full">
          <el-option label="Class" value="class" />
          <el-option label="Delegate Expression" value="delegateExpression" />
          <el-option label="Expression" value="expression" />
        </el-select>
      </el-form-item>
      <el-form-item
        v-if="formData.serviceType"
        label="服务值"
        prop="serviceValue"
      >
        <el-input
          v-model="formData.serviceValue"
          placeholder="请输入类名或表达式"
        />
      </el-form-item>
      <el-form-item label="结果变量" prop="resultVariableName">
        <el-input
          v-model="formData.resultVariableName"
          placeholder="resultVar"
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
  serviceType: "class",
  serviceValue: "",
  resultVariableName: ""
});

const initData = () => {
  if (!props.element) return;
  const bo = props.element.businessObject;

  Object.keys(formData.value).forEach(key => {
    if (key === "serviceType") {
      formData.value.serviceType = bo.class
        ? "class"
        : bo.delegateExpression
          ? "delegateExpression"
          : bo.expression
            ? "expression"
            : "class";
    } else if (key === "serviceValue") {
      formData.value.serviceValue =
        bo.class || bo.delegateExpression || bo.expression || "";
    } else if (key === "resultVariableName") {
      formData.value.resultVariableName = bo.resultVariableName || "";
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
        const settings: any = {
          class: undefined,
          delegateExpression: undefined,
          expression: undefined,
          resultVariableName: formData.value.resultVariableName
        };
        if (formData.value.serviceType) {
          settings[formData.value.serviceType] = formData.value.serviceValue;
        }
        resolve(settings);
      } else {
        reject(new Error("服务配置验证失败"));
      }
    });
  });
};

defineExpose({
  getProperties
});
</script>
