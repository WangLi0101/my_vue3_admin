<template>
  <el-card shadow="never" class="full-height">
    <template #header>
      <div class="rule-head">
        <span>规则编辑</span>
        <el-space>
          <el-button type="primary" @click="openAddRuleDialog">
            <el-icon><Plus /></el-icon>
            新增规则
          </el-button>
          <el-button @click="emit('loadDemo')">加载示例</el-button>
        </el-space>
      </div>
    </template>

    <div class="rules-list">
      <el-card
        v-for="(rule, ruleIndex) in rulesRef"
        :key="rule.id"
        shadow="never"
        class="rule-item"
      >
        <template #header>
          <div class="rule-item-head">
            <div class="rule-item-title">
              <span
                >规则 {{ ruleIndex + 1 }}：{{ rule.name || "未命名规则" }}</span
              >
              <el-tag type="info">priority: {{ rule.priority }}</el-tag>
            </div>
            <el-space>
              <el-button @click="resetRule(rule.id)">
                <el-icon><RefreshRight /></el-icon>
                重置
              </el-button>
              <el-button type="danger" plain @click="removeRule(rule.id)">
                <el-icon><Delete /></el-icon>
                删除
              </el-button>
            </el-space>
          </div>
        </template>

        <el-form label-width="96px" class="rule-form">
          <el-form-item label="规则名称">
            <el-input v-model="rule.name" placeholder="例如：报名资格通过" />
          </el-form-item>
          <el-form-item label="优先级">
            <el-input-number v-model="rule.priority" :min="1" :max="999" />
          </el-form-item>
        </el-form>

        <div class="editor-section">
          <div class="section-title">条件关系预览</div>
          <div class="expression-box">{{ getRuleExpression(rule) }}</div>
        </div>

        <RuleConditionsEditor v-model:root-condition="rule.rootCondition" />

        <div class="editor-section">
          <div class="section-title">
            动作参数
            <el-button type="primary" link @click="addEventParam(rule.id)">
              <el-icon><Plus /></el-icon>
              新增参数
            </el-button>
          </div>
          <el-form label-width="96px">
            <el-form-item label="事件类型">
              <el-input
                v-model="rule.eventType"
                placeholder="例如：signup.approved"
              />
            </el-form-item>
          </el-form>
          <div
            v-for="(param, paramIndex) in rule.eventParams"
            :key="param.id"
            class="param-row"
          >
            <el-input
              v-model="param.key"
              :placeholder="`参数名（参数${paramIndex + 1}）`"
            />
            <el-select v-model="param.valueType">
              <el-option
                v-for="option in paramTypeOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <el-input
              v-model="param.value"
              placeholder="参数值（JSON 类型需要合法 JSON）"
            />
            <el-button
              type="danger"
              plain
              @click="removeEventParam(rule.id, param.id)"
            >
              删除
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <el-dialog v-model="addRuleDialogVisible" title="新增规则" width="560px">
      <el-form label-width="96px">
        <el-form-item label="规则名称" required>
          <el-input
            v-model="newRuleForm.name"
            placeholder="例如：报名资格通过"
          />
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number v-model="newRuleForm.priority" :min="1" :max="999" />
        </el-form-item>
        <el-form-item label="根组关系">
          <el-radio-group v-model="newRuleForm.conditionLogic">
            <el-radio-button value="all">全部满足（all）</el-radio-button>
            <el-radio-button value="any">任一满足（any）</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="事件类型">
          <el-input
            v-model="newRuleForm.eventType"
            placeholder="rule.matched"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-space>
          <el-button @click="addRuleDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmAddRule">确认新增</el-button>
        </el-space>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { ElMessage } from "element-plus";
import { Delete, Plus, RefreshRight } from "@element-plus/icons-vue";
import RuleConditionsEditor from "./RuleConditionsEditor.vue";
import {
  createEventParamDraft,
  createRuleDraft,
  paramTypeOptions,
  type ConditionLogic,
  type ConditionNodeDraft,
  type RuleDraft
} from "../model";

defineOptions({
  name: "RuleEditorPanel"
});

const emit = defineEmits<{
  loadDemo: [];
}>();

const rulesRef = defineModel<RuleDraft[]>("rules", { required: true });
const activeRuleIdRef = defineModel<string>("activeRuleId", { required: true });

const addRuleDialogVisible = ref(false);
const newRuleForm = ref({
  name: "",
  priority: 1,
  conditionLogic: "all" as ConditionLogic,
  eventType: "rule.matched"
});

const openAddRuleDialog = () => {
  newRuleForm.value = {
    name: `规则 ${rulesRef.value.length + 1}`,
    priority: rulesRef.value.length + 1,
    conditionLogic: "all",
    eventType: "rule.matched"
  };
  addRuleDialogVisible.value = true;
};

const confirmAddRule = () => {
  const name = newRuleForm.value.name.trim();
  if (!name) {
    ElMessage.warning("请填写规则名称");
    return;
  }

  const next = createRuleDraft(rulesRef.value.length + 1);
  next.name = name;
  next.priority = newRuleForm.value.priority;
  next.rootCondition.logic = newRuleForm.value.conditionLogic;
  next.eventType = newRuleForm.value.eventType.trim() || "rule.matched";

  rulesRef.value.push(next);
  activeRuleIdRef.value = next.id;
  addRuleDialogVisible.value = false;
  ElMessage.success("规则已新增");
};

const getRule = (ruleId: string) => {
  return rulesRef.value.find(item => item.id === ruleId);
};

const removeRule = (ruleId: string) => {
  if (rulesRef.value.length <= 1) {
    ElMessage.warning("至少保留一条规则");
    return;
  }

  rulesRef.value = rulesRef.value.filter(item => item.id !== ruleId);
  if (!rulesRef.value.some(item => item.id === activeRuleIdRef.value)) {
    activeRuleIdRef.value = rulesRef.value[0].id;
  }
};

const resetRule = (ruleId: string) => {
  const index = rulesRef.value.findIndex(item => item.id === ruleId);
  if (index < 0) return;

  const current = rulesRef.value[index];
  const next = createRuleDraft(index + 1);
  next.name = current.name;
  next.priority = current.priority;
  next.rootCondition.logic = current.rootCondition.logic;
  next.eventType = current.eventType;
  rulesRef.value[index] = next;

  if (activeRuleIdRef.value === ruleId) {
    activeRuleIdRef.value = next.id;
  }
};

const addEventParam = (ruleId: string) => {
  const target = getRule(ruleId);
  target?.eventParams.push(createEventParamDraft());
};

const removeEventParam = (ruleId: string, paramId: string) => {
  const target = getRule(ruleId);
  if (!target) return;
  target.eventParams = target.eventParams.filter(item => item.id !== paramId);
};

const formatOperator = (operator: string) => {
  const map: Record<string, string> = {
    equal: "==",
    notEqual: "!=",
    greaterThan: ">",
    greaterThanInclusive: ">=",
    lessThan: "<",
    lessThanInclusive: "<=",
    contains: "CONTAINS",
    doesNotContain: "NOT_CONTAINS",
    in: "IN",
    notIn: "NOT_IN"
  };
  return map[operator] || operator;
};

const formatValue = (raw: string) => {
  const source = raw.trim();
  if (!source) return "<value>";
  if (
    source === "true" ||
    source === "false" ||
    /^-?\d+(\.\d+)?$/.test(source) ||
    (source.startsWith("[") && source.endsWith("]")) ||
    (source.startsWith("{") && source.endsWith("}"))
  ) {
    return source;
  }
  return `"${source.replaceAll('"', '\\"')}"`;
};

const formatNode = (node: ConditionNodeDraft): string => {
  if (node.nodeType === "leaf") {
    const fact = node.fact.trim() || "<fact>";
    return `${fact} ${formatOperator(node.operator)} ${formatValue(node.value)}`;
  }

  const children = node.children.map(child => formatNode(child));
  if (children.length === 0) return "(<empty-group>)";
  const joiner = node.logic === "all" ? " AND " : " OR ";
  return `(${children.join(joiner)})`;
};

const getRuleExpression = (rule: RuleDraft) => {
  return formatNode(rule.rootCondition);
};
</script>

<style lang="scss" scoped>
.full-height {
  height: 100%;
}

.rule-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  border: 1px solid var(--el-border-color-light);
}

.rule-item-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.rule-item-title {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rule-form {
  margin-top: 4px;
}

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

.expression-box {
  padding: 8px 10px;
  margin-bottom: 10px;
  overflow-x: auto;
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  white-space: nowrap;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.param-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: 8px;
  margin-bottom: 8px;
}

@media (width <= 1200px) {
  .rule-item-head,
  .rule-item-title {
    flex-wrap: wrap;
  }

  .param-row {
    grid-template-columns: 1fr;
  }
}
</style>
