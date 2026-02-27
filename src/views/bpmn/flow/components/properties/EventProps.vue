<template>
  <el-form ref="formRef" :model="formData" label-position="top">
    <div class="group-box mb-8">
      <div
        class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
      >
        <div class="w-1 h-3 bg-yellow-500 rounded-full" />
        事件配置
      </div>

      <!-- 定时器配置 -->
      <div v-if="isTimerEvent">
        <el-form-item label="定时器类型">
          <el-select v-model="formData.timerType" class="w-full">
            <el-option label="日期 (Date ISO8601)" value="timeDate" />
            <el-option label="持续时间 (Duration PT1H)" value="timeDuration" />
            <el-option label="循环 (Cycle R/PT10M)" value="timeCycle" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间数值" prop="timerValue">
          <el-input
            v-model="formData.timerValue"
            placeholder="例如: PT1H (1小时后) 或 R/PT10M"
          />
          <div class="text-xs text-gray-400 mt-1">
            <span v-if="formData.timerType === 'timeDuration'"
              >PnYnMnDTnHnMnS 格式，如 PT15M 表示15分钟</span
            >
            <span v-else-if="formData.timerType === 'timeCycle'"
              >R/Duration 格式，如 R3/PT10H 表示重复3次，间隔10小时</span
            >
          </div>
        </el-form-item>
      </div>

      <div v-else class="text-sm text-gray-400 p-2 text-center bg-gray-50">
        暂不支持此类型事件配置
      </div>
    </div>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch, computed, useTemplateRef } from "vue";
import BpmnModeler from "bpmn-js/lib/Modeler";

interface Props {
  modeler: BpmnModeler;
  element: any;
}
const props = defineProps<Props>();
const formRef = useTemplateRef("formRef");

const formData = ref({
  timerType: "timeDuration",
  timerValue: ""
});

// 计算当前是否为定时器相关事件
const isTimerEvent = computed(() => {
  if (!props.element) return false;
  const bo = props.element.businessObject;
  if (!bo.eventDefinitions || bo.eventDefinitions.length === 0) return false;
  return bo.eventDefinitions[0].$type === "bpmn:TimerEventDefinition";
});

const initData = () => {
  if (!isTimerEvent.value) return;
  const bo = props.element.businessObject;
  const timerDoc = bo.eventDefinitions[0];

  if (timerDoc.timeDate) {
    formData.value.timerType = "timeDate";
    formData.value.timerValue = timerDoc.timeDate.body;
  } else if (timerDoc.timeCycle) {
    formData.value.timerType = "timeCycle";
    formData.value.timerValue = timerDoc.timeCycle.body;
  } else if (timerDoc.timeDuration) {
    formData.value.timerType = "timeDuration";
    formData.value.timerValue = timerDoc.timeDuration.body;
  } else {
    // 默认
    formData.value.timerType = "timeDuration";
    formData.value.timerValue = "";
  }
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
    if (!isTimerEvent.value) {
      resolve({});
      return;
    }

    formRef.value.validate((valid: boolean) => {
      if (valid) {
        const moddle = props.modeler.get("moddle") as any;
        const timerDefinition = moddle.create("bpmn:TimerEventDefinition");

        // 创建形式表达式
        const formalExpression = moddle.create("bpmn:FormalExpression", {
          body: formData.value.timerValue
        });

        // 根据类型设置属性
        // 清空旧的属性不需要显式做，因为我们是替换 eventDefinitions 数组
        if (formData.value.timerType === "timeDate") {
          timerDefinition.timeDate = formalExpression;
        } else if (formData.value.timerType === "timeCycle") {
          timerDefinition.timeCycle = formalExpression;
        } else {
          timerDefinition.timeDuration = formalExpression;
        }

        resolve({
          eventDefinitions: [timerDefinition]
        });
      } else {
        reject(new Error("事件配置验证失败"));
      }
    });
  });
};

defineExpose({
  getProperties
});
</script>
