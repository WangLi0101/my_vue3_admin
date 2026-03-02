<template>
  <div class="group-block" :class="{ 'is-root': isRoot }">
    <div class="group-head">
      <div class="group-title">
        {{ isRoot ? "根条件组" : `子条件组（第${level + 1}层）` }}
      </div>
      <el-space wrap>
        <el-radio-group v-model="groupRef.logic" size="small">
          <el-radio-button value="all">全部满足（all）</el-radio-button>
          <el-radio-button value="any">任一满足（any）</el-radio-button>
        </el-radio-group>
        <el-button type="primary" link @click="addLeaf">
          <el-icon><Plus /></el-icon>
          新增条件
        </el-button>
        <el-button type="primary" link @click="addGroup">
          <el-icon><Plus /></el-icon>
          新增子组
        </el-button>
        <el-button
          v-if="!isRoot"
          type="danger"
          link
          @click="emit('removeSelf')"
        >
          <el-icon><Delete /></el-icon>
          删除组
        </el-button>
      </el-space>
    </div>

    <div class="group-children">
      <template v-for="node in groupRef.children" :key="node.id">
        <div v-if="!isGroup(node)" class="condition-row">
          <el-input v-model="node.fact" placeholder="fact 字段" />
          <el-select v-model="node.operator">
            <el-option
              v-for="option in operatorOptions"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-input
            v-model="node.value"
            placeholder='值（支持 18 / true / ["vip"] / {"a":1}）'
          />
          <el-button
            type="danger"
            link
            :icon="Delete"
            @click="removeChild(node.id)"
          />
        </div>
        <ConditionGroupEditor
          v-else
          :group="node"
          :level="level + 1"
          @remove-self="removeChild(node.id)"
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { Delete, Plus } from "@element-plus/icons-vue";
import {
  createConditionDraft,
  createConditionGroupDraft,
  operatorOptions,
  type ConditionGroupDraft,
  type ConditionNodeDraft
} from "../model";

defineOptions({
  name: "ConditionGroupEditor"
});

withDefaults(
  defineProps<{
    level?: number;
    isRoot?: boolean;
  }>(),
  {
    level: 0,
    isRoot: false
  }
);

const groupRef = defineModel<ConditionGroupDraft>("group", {
  required: true
});

const emit = defineEmits<{
  removeSelf: [];
}>();

const isGroup = (node: ConditionNodeDraft): node is ConditionGroupDraft => {
  return node.nodeType === "group";
};

const addLeaf = () => {
  groupRef.value.children.push(createConditionDraft());
};

const addGroup = () => {
  groupRef.value.children.push(createConditionGroupDraft("all"));
};

const removeChild = (nodeId: string) => {
  if (groupRef.value.children.length <= 1) {
    ElMessage.warning("每个条件组至少保留一个子节点");
    return;
  }
  groupRef.value.children = groupRef.value.children.filter(
    item => item.id !== nodeId
  );
};
</script>

<style lang="scss" scoped>
.group-block {
  padding: 10px;
  margin-top: 8px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
}

.group-block:not(.is-root) {
  margin-left: 12px;
}

.group-head {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--el-text-color-secondary);
}

.group-children {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.condition-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 8px;
}

@media (width <= 1200px) {
  .group-block:not(.is-root) {
    margin-left: 0;
  }

  .condition-row {
    grid-template-columns: 1fr;
  }
}
</style>
