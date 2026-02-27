<template>
  <div class="tree-block" :class="{ 'is-root': isRoot }">
    <div class="tree-node-head">
      <el-tag
        size="small"
        :type="group.logic === 'all' ? 'success' : 'warning'"
      >
        {{ group.logic.toUpperCase() }}
      </el-tag>
      <span class="tree-node-desc">
        {{ group.logic === "all" ? "以下条件全部满足" : "以下条件任一满足" }}
      </span>
    </div>

    <div class="tree-children">
      <div
        v-for="node in group.children"
        :key="node.id"
        class="tree-child-item"
      >
        <div v-if="!isGroup(node)" class="leaf-row">
          <span class="leaf-fact">{{ node.fact || "<未填写fact>" }}</span>
          <span class="leaf-op">{{ getOperatorLabel(node.operator) }}</span>
          <span class="leaf-value">{{ node.value || "<空值>" }}</span>
        </div>
        <ConditionTreePreview v-else :group="node" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  operatorOptions,
  type ConditionGroupDraft,
  type ConditionNodeDraft
} from "../model";

defineOptions({
  name: "ConditionTreePreview"
});

withDefaults(
  defineProps<{
    group: ConditionGroupDraft;
    isRoot?: boolean;
  }>(),
  {
    isRoot: false
  }
);

const isGroup = (node: ConditionNodeDraft): node is ConditionGroupDraft => {
  return node.nodeType === "group";
};

const getOperatorLabel = (operator: string) => {
  return (
    operatorOptions.find(item => item.value === operator)?.label ||
    `操作符(${operator})`
  );
};
</script>

<style lang="scss" scoped>
.tree-block {
  padding: 8px;
  margin-top: 8px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
}

.tree-block:not(.is-root) {
  margin-left: 12px;
  background: var(--el-fill-color-lighter);
}

.tree-node-head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.tree-node-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.tree-children {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.leaf-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  padding: 8px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.leaf-fact {
  font-weight: 600;
  color: var(--el-color-primary);
}

.leaf-op {
  color: var(--el-text-color-secondary);
}

.leaf-value {
  color: var(--el-text-color-regular);
  word-break: break-all;
}

@media (width <= 1200px) {
  .tree-block:not(.is-root) {
    margin-left: 0;
  }
}
</style>
