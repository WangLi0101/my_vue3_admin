<template>
  <div class="ruleset-editor">
    <el-card shadow="never">
      <template #header>
        <div class="panel-title">json-rules-engine 规则引擎编辑器</div>
      </template>
      <el-alert
        type="info"
        :closable="false"
        show-icon
        title="支持条件、动作参数、规则 JSON 导入导出。"
      />
    </el-card>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="12">
        <RuleEditorPanel
          v-model:rules="rules"
          v-model:active-rule-id="activeRuleId"
          @load-demo="loadDemo"
        />
      </el-col>

      <el-col :xs="24" :lg="12">
        <el-card shadow="never" class="full-height">
          <template #header>
            <div class="rule-head">
              <span>执行与JSON</span>
              <el-space>
                <el-button type="success" :loading="running" @click="runRules">
                  <el-icon><VideoPlay /></el-icon>
                  执行规则
                </el-button>
                <el-button @click="clearRunResult">清空结果</el-button>
              </el-space>
            </div>
          </template>

          <div class="editor-section">
            <div class="section-title">事实数据（Facts）</div>
            <el-input
              v-model="factsText"
              type="textarea"
              :rows="8"
              placeholder="请输入用于规则计算的 JSON 对象"
            />
            <el-alert
              v-if="factsError"
              type="error"
              :closable="false"
              :title="`JSON 错误：${factsError}`"
              class="mt-3"
            />
          </div>

          <div class="editor-section">
            <div class="section-title">执行结果</div>
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="规则总数">
                {{ rules.length }}
              </el-descriptions-item>
              <el-descriptions-item label="命中规则数">
                {{ matchedCount }}
              </el-descriptions-item>
              <el-descriptions-item label="实际执行数">
                {{ evaluatedCount }}
              </el-descriptions-item>
              <el-descriptions-item label="最后执行时间" :span="2">
                {{ lastRunAt || "-" }}
              </el-descriptions-item>
            </el-descriptions>

            <div v-if="runLogs.length === 0" class="empty-tip">
              暂无执行结果，点击“执行规则”查看命中详情。
            </div>
            <div v-else class="run-list">
              <div v-for="item in runLogs" :key="item.ruleId" class="run-item">
                <div class="run-item-head">
                  <span>{{ item.ruleName }}</span>
                  <el-tag :type="item.matched ? 'success' : 'info'">
                    {{ item.matched ? "命中" : "未命中" }}
                  </el-tag>
                </div>
                <div v-if="item.error" class="run-item-error">
                  执行失败：{{ item.error }}
                </div>
                <template v-else>
                  <div
                    v-if="item.matched && item.events.length > 0"
                    class="action-block"
                  >
                    <div class="action-title">执行成功后的动作参数</div>
                    <div
                      v-for="(event, eventIndex) in item.events"
                      :key="`${item.ruleId}-${event.type}-${eventIndex}`"
                      class="action-item"
                    >
                      <div class="action-type">
                        事件：{{ event.type || "unknown" }}
                      </div>
                      <pre class="action-json">{{
                        JSON.stringify(event.params ?? {}, null, 2)
                      }}</pre>
                    </div>
                  </div>
                  <div
                    v-if="!item.matched && item.failedConditions.length > 0"
                    class="failed-conditions-block"
                  >
                    <div class="failed-conditions-title">不满足的条件</div>
                    <div
                      v-for="(cond, condIdx) in item.failedConditions"
                      :key="condIdx"
                      class="failed-condition-row"
                    >
                      <el-tag type="danger" size="small">{{
                        cond.fact
                      }}</el-tag>
                      <span class="failed-cond-op">{{ cond.operator }}</span>
                      <el-tag size="small" type="info">{{
                        JSON.stringify(cond.value)
                      }}</el-tag>
                      <span class="failed-cond-sep">但实际值为</span>
                      <el-tag size="small" type="warning">{{
                        JSON.stringify(cond.factValue)
                      }}</el-tag>
                    </div>
                  </div>
                  <pre class="run-item-json">{{
                    JSON.stringify(
                      {
                        events: item.events,
                        failureEvents: item.failureEvents
                      },
                      null,
                      2
                    )
                  }}</pre>
                </template>
              </div>
            </div>
          </div>

          <div class="editor-section">
            <div class="section-title">规则JSON（Engine格式）</div>
            <el-input
              :model-value="previewTextDisplay"
              type="textarea"
              :rows="10"
            />
          </div>

          <div class="editor-section">
            <div class="section-title">
              导入规则JSON
              <el-button type="primary" link @click="fillImportFromCurrent">
                用当前配置填充
              </el-button>
              <el-button type="primary" link @click="importRules">
                执行导入
              </el-button>
            </div>
            <el-input
              v-model="importText"
              type="textarea"
              :rows="8"
              placeholder="支持导入单条规则对象或规则数组"
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { ElMessage } from "element-plus";
import { VideoPlay } from "@element-plus/icons-vue";
import { Engine, type RuleProperties } from "json-rules-engine";
import RuleEditorPanel from "./components/RuleEditorPanel.vue";
import signupFacts from "./examples/signup-facts.json";
import signupRules from "./examples/signup-rules.json";
import {
  createRuleDraft,
  engineRuleToDraft,
  toEngineRule,
  type RuleDraft
} from "./model";

defineOptions({
  name: "RuleEngineEditor"
});

interface RuleRunLog {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  events: Array<Record<string, any>>;
  failureEvents: Array<Record<string, any>>;
  failedConditions: Array<{
    fact: string;
    operator: string;
    value: unknown;
    factValue: unknown;
  }>;
  error: string;
}

interface ImportPayload {
  rules: Partial<RuleProperties>[];
}

const rules = ref<RuleDraft[]>([createRuleDraft(1)]);
const activeRuleId = ref(rules.value[0].id);

const factsText = ref(JSON.stringify(signupFacts, null, 2));

const importText = ref("");
const running = ref(false);
const runLogs = ref<RuleRunLog[]>([]);
const lastRunAt = ref("");

const matchedCount = computed(
  () => runLogs.value.filter(item => item.matched).length
);

const evaluatedCount = computed(() => runLogs.value.length);

const factsError = computed(() => {
  try {
    const parsed = JSON.parse(factsText.value);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      return "事实数据必须是 JSON 对象";
    }
    return "";
  } catch (error) {
    return (error as Error).message;
  }
});

const previewText = computed<RuleProperties[] | { error: string }>(() => {
  try {
    return rules.value.map(rule => toEngineRule(rule));
  } catch (error) {
    return {
      error: `规则 JSON 生成失败：${(error as Error).message}`
    };
  }
});

const previewTextDisplay = computed(() =>
  JSON.stringify(previewText.value, null, 2)
);

const parseFacts = () => {
  const parsed = JSON.parse(factsText.value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("事实数据必须是 JSON 对象");
  }
  return parsed as Record<string, unknown>;
};

/**
 * 递归提取不满足的叶子条件
 */
const extractFailedConditions = (
  node: Record<string, any>
): Array<{
  fact: string;
  operator: string;
  value: unknown;
  factValue: unknown;
}> => {
  if ("fact" in node) {
    // 是叶子条件
    if (node.result === false) {
      return [
        {
          fact: String(node.fact ?? ""),
          operator: String(node.operator ?? ""),
          value: node.value,
          factValue: node.factResult
        }
      ];
    }
    return [];
  }

  // 是分组条件，递归遍历子节点
  const children: Record<string, any>[] = node.all ?? node.any ?? [];
  return children.flatMap((child: Record<string, any>) =>
    extractFailedConditions(child)
  );
};

const fillImportFromCurrent = () => {
  importText.value = previewTextDisplay.value;
};

const importRules = () => {
  if (!importText.value.trim()) {
    ElMessage.warning("请先输入要导入的规则 JSON");
    return;
  }
  try {
    const parsed = JSON.parse(importText.value);
    let rawRules: Partial<RuleProperties>[] = [];

    if (Array.isArray(parsed)) {
      rawRules = parsed;
    } else if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.rules)
    ) {
      const payload = parsed as ImportPayload;
      rawRules = payload.rules;
    } else if (parsed && typeof parsed === "object") {
      rawRules = [parsed];
    }

    if (rawRules.length === 0) {
      throw new Error("导入内容为空");
    }
    const nextRules = rawRules.map((item, index) =>
      engineRuleToDraft(item, index)
    );
    rules.value = nextRules;
    activeRuleId.value = nextRules[0].id;
    ElMessage.success(`成功导入 ${nextRules.length} 条规则`);
  } catch (error) {
    ElMessage.error(`导入失败：${(error as Error).message}`);
  }
};

const loadDemo = () => {
  const demoRules = (signupRules as Partial<RuleProperties>[]).map(
    (rule, index) => engineRuleToDraft(rule, index)
  );
  if (demoRules.length === 0) {
    ElMessage.error("示例规则为空，请检查示例 JSON");
    return;
  }
  rules.value = demoRules;
  activeRuleId.value = demoRules[0].id;
  factsText.value = JSON.stringify(signupFacts, null, 2);
  ElMessage.success("报名系统示例规则已加载（6条规则）");
};

const runRules = async () => {
  if (factsError.value) {
    ElMessage.error(`事实数据有误：${factsError.value}`);
    return;
  }

  const facts = parseFacts();
  running.value = true;

  try {
    const logs: RuleRunLog[] = [];
    for (const draft of rules.value) {
      const log: RuleRunLog = {
        ruleId: draft.id,
        ruleName: draft.name || "未命名规则",
        matched: false,
        events: [],
        failureEvents: [],
        failedConditions: [],
        error: ""
      };

      try {
        const engineRule = toEngineRule(draft);
        const engine = new Engine();
        const events: Array<Record<string, any>> = [];

        engine.addRule(engineRule);
        engine.on(engineRule.event.type, (payload: Record<string, any>) => {
          events.push({
            type: engineRule.event.type,
            params:
              payload && typeof payload === "object" && "params" in payload
                ? (payload.params ?? {})
                : (payload ?? {})
          });
        });

        const result = await engine.run(facts);
        log.events =
          result.events?.length > 0
            ? result.events.map(event => ({
                type: event.type || engineRule.event.type,
                params: event.params ?? {}
              }))
            : events;
        log.failureEvents = result.failureEvents;
        log.matched = log.events.length > 0;
        // 提取不满足的条件（仅对未命中的规则）
        if (!log.matched && result.failureResults?.length > 0) {
          const condTree = result.failureResults[0]?.conditions as Record<
            string,
            any
          >;
          if (condTree) {
            log.failedConditions = extractFailedConditions(condTree);
          }
        }
      } catch (error) {
        log.error = (error as Error).message;
      }

      logs.push(log);
    }

    runLogs.value = logs;
    lastRunAt.value = new Date().toLocaleString();
    ElMessage.success("规则执行完成");
  } finally {
    running.value = false;
  }
};

const clearRunResult = () => {
  runLogs.value = [];
  lastRunAt.value = "";
};
</script>

<style lang="scss" scoped>
.ruleset-editor {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
}

.full-height {
  height: 100%;
}

.rule-head {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
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

.empty-tip {
  padding: 12px;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.run-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 10px;
}

.run-item {
  padding: 10px;
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
}

.run-item-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.run-item-error {
  margin-top: 8px;
  color: var(--el-color-danger);
}

.action-block {
  padding: 8px;
  margin-top: 8px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
}

.action-title {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-success);
}

.action-item + .action-item {
  margin-top: 8px;
}

.action-type {
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.action-json {
  padding: 8px;
  margin: 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  background: var(--el-bg-color);
  border-radius: 6px;
}

.run-item-json {
  padding: 8px;
  margin: 8px 0 0;
  overflow: auto;
  font-size: 12px;
  line-height: 1.5;
  color: var(--el-text-color-regular);
  white-space: pre-wrap;
  background: var(--el-fill-color-light);
  border-radius: 6px;
}

.failed-conditions-block {
  padding: 8px;
  margin-top: 8px;
  background: var(--el-color-danger-light-9);
  border: 1px solid var(--el-color-danger-light-7);
  border-radius: 6px;
}

.failed-conditions-title {
  margin-bottom: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--el-color-danger);
}

.failed-condition-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  padding: 4px 0;
}

.failed-cond-op {
  font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.failed-cond-sep {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
