<template>
  <div class="editor-section">
    <div class="section-title">
      条件列表
      <el-button type="primary" link @click="emit('addCondition', ruleId)">
        <el-icon><Plus /></el-icon>
        新增条件
      </el-button>
    </div>
    <div
      v-for="(condition, conditionIndex) in conditionsRef"
      :key="condition.id"
      class="condition-row"
    >
      <el-input
        v-model="condition.fact"
        :placeholder="`fact 字段（条件${conditionIndex + 1}）`"
      />
      <el-select v-model="condition.operator">
        <el-option
          v-for="option in operatorOptions"
          :key="option.value"
          :label="option.label"
          :value="option.value"
        />
      </el-select>
      <el-input
        v-model="condition.value"
        placeholder='值（支持 18 / true / ["vip"] / {"a":1}）'
      />
      <el-button
        type="danger"
        plain
        @click="emit('removeCondition', ruleId, condition.id)"
      >
        删除
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Plus } from "@element-plus/icons-vue";
import { operatorOptions, type ConditionDraft } from "../model";

defineOptions({
  name: "RuleConditionsEditor"
});

defineProps<{
  ruleId: string;
}>();

const emit = defineEmits<{
  addCondition: [ruleId: string];
  removeCondition: [ruleId: string, conditionId: string];
}>();

const conditionsRef = defineModel<ConditionDraft[]>("conditions", {
  required: true
});
</script>

<style lang="scss" scoped>
.editor-section {
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.section-title {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
}

.condition-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
}

@media (width <= 1200px) {
  .condition-row {
    grid-template-columns: 1fr;
  }
}
</style>
