<template>
  <el-form ref="formRef" :model="formData" label-position="top">
    <div class="group-box mb-8">
      <div
        class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-gray-600 rounded-full" />
        多实例设置
      </div>
      <el-form-item label="实例类型">
        <el-select v-model="formData.multiInstanceType" class="w-full">
          <el-option label="无" value="none" />
          <el-option label="并行 (Parallel)" value="parallel" />
          <el-option label="串行 (Sequential)" value="sequential" />
        </el-select>
      </el-form-item>
      <div
        v-if="formData.multiInstanceType !== 'none'"
        class="bg-gray-50 p-3 rounded-md border border-gray-100"
      >
        <el-form-item label="集合 (Collection)" class="!mb-2" prop="collection">
          <el-input v-model="formData.collection" size="small" />
        </el-form-item>
        <el-form-item
          label="元素变量 (Element Var)"
          class="!mb-2"
          prop="elementVariable"
        >
          <el-input v-model="formData.elementVariable" size="small" />
        </el-form-item>
        <el-form-item label="完成条件" class="!mb-0" prop="completionCondition">
          <el-input
            v-model="formData.completionCondition"
            size="small"
            placeholder="${nrOfCompletedInstances/nrOfInstances >= 0.6}"
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
  element: any;
}
const props = defineProps<Props>();
const formRef = useTemplateRef("formRef");

const formData = ref({
  multiInstanceType: "none",
  collection: "",
  elementVariable: "",
  completionCondition: ""
});

const getBusinessObject = (element: any) => {
  return element.businessObject;
};

const initData = () => {
  if (!props.element) return;
  const bo = getBusinessObject(props.element);

  let miType = "none";
  if (bo.loopCharacteristics) {
    if (
      bo.loopCharacteristics.$type === "bpmn:MultiInstanceLoopCharacteristics"
    ) {
      miType = bo.loopCharacteristics.isSequential ? "sequential" : "parallel";
    }
  }

  Object.keys(formData.value).forEach(key => {
    switch (key) {
      case "multiInstanceType":
        formData.value.multiInstanceType = miType;
        break;
      case "collection":
        formData.value.collection = bo.loopCharacteristics?.collection || "";
        break;
      case "elementVariable":
        formData.value.elementVariable =
          bo.loopCharacteristics?.elementVariable || "";
        break;
      case "completionCondition":
        formData.value.completionCondition =
          bo.loopCharacteristics?.completionCondition?.body || "";
        break;
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
        const moddle = props.modeler.get("moddle") as any;
        const {
          multiInstanceType,
          collection,
          elementVariable,
          completionCondition
        } = formData.value;

        if (multiInstanceType === "none") {
          resolve({ loopCharacteristics: undefined });
          return;
        }

        const loopCharacteristics = moddle.create(
          "bpmn:MultiInstanceLoopCharacteristics"
        );
        loopCharacteristics.isSequential = multiInstanceType === "sequential";
        loopCharacteristics.collection = collection;
        loopCharacteristics.elementVariable = elementVariable;

        if (completionCondition) {
          loopCharacteristics.completionCondition = moddle.create(
            "bpmn:FormalExpression",
            { body: completionCondition }
          );
        }

        resolve({ loopCharacteristics });
      } else {
        reject(new Error("多实例设置验证失败"));
      }
    });
  });
};

defineExpose({
  getProperties
});
</script>
