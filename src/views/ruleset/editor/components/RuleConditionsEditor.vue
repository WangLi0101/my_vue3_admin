<template>
  <div class="editor-section">
    <div class="section-title">条件树编辑</div>
    <ConditionGroupEditor v-model:group="rootConditionRef" :is-root="true" />
  </div>
</template>

<script setup lang="ts">
import ConditionGroupEditor from "./ConditionGroupEditor.vue";
import { type ConditionGroupDraft } from "../model";

defineOptions({
  name: "RuleConditionsEditor"
});

const rootConditionRef = defineModel<ConditionGroupDraft>("rootCondition", {
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
</style>
