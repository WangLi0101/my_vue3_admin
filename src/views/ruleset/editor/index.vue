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
        title="支持条件、动作参数、规则 JSON 导入导出，以及规则级/规则集级双执行模式。"
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
                <el-select
                  v-model="executionStrategy"
                  class="strategy-select"
                  placeholder="请选择执行策略"
                >
                  <el-option
                    v-for="option in executionStrategyOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-select
                  v-model="rulesetMeta.executionMode"
                  class="strategy-select"
                  placeholder="请选择规则集模式"
                >
                  <el-option
                    v-for="option in rulesetExecutionModeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
                <el-button type="success" :loading="running" @click="runRules">
                  <el-icon><VideoPlay /></el-icon>
                  执行规则
                </el-button>
                <el-button @click="clearRunResult">清空结果</el-button>
              </el-space>
            </div>
          </template>

          <div class="editor-section">
            <div class="section-title">执行策略说明</div>
            <el-form label-width="96px" class="ruleset-form">
              <el-form-item label="规则集名称">
                <el-input
                  v-model="rulesetMeta.name"
                  placeholder="请输入规则集名称"
                />
              </el-form-item>
            </el-form>
            <el-alert
              type="warning"
              :closable="false"
              show-icon
              :title="executionStrategyDesc"
            />
            <el-alert
              class="mt-3"
              type="info"
              :closable="false"
              show-icon
              :title="rulesetExecutionModeDesc"
            />
          </div>

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
              <el-descriptions-item label="执行策略">
                {{ executionStrategyLabel }}
              </el-descriptions-item>
              <el-descriptions-item label="规则集模式">
                {{ rulesetExecutionModeLabel }}
              </el-descriptions-item>
              <el-descriptions-item label="规则集结果">
                <el-tag :type="rulesetResult.tagType">
                  {{ rulesetResult.status }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="最后执行时间" :span="2">
                {{ lastRunAt || "-" }}
              </el-descriptions-item>
            </el-descriptions>
            <div v-if="runLogs.length > 0" class="result-tip">
              {{ rulesetResult.detail }}
            </div>

            <div v-if="runLogs.length === 0" class="empty-tip">
              暂无执行结果，点击“执行规则”查看命中详情。
            </div>
            <div v-else class="run-list">
              <div v-for="item in runLogs" :key="item.ruleId" class="run-item">
                <div class="run-item-head">
                  <span>{{ item.ruleName }}</span>
                  <el-tag v-if="item.skipped" type="warning">已跳过</el-tag>
                  <el-tag v-else :type="item.matched ? 'success' : 'info'">
                    {{ item.matched ? "命中" : "未命中" }}
                  </el-tag>
                </div>
                <div v-if="item.skipped" class="run-item-skip">
                  {{ item.skipReason }}
                </div>
                <div v-else-if="item.error" class="run-item-error">
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
            <el-input :model-value="previewText" type="textarea" :rows="10" />
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
import {
  createConditionDraft,
  createEventParamDraft,
  createId,
  createRuleDraft,
  type ConditionLogic,
  type ParamValueType,
  type RuleDraft
} from "./model";

defineOptions({
  name: "RuleEngineEditor"
});

type ExecutionStrategy = "all" | "priorityFirstHit" | "orderFirstHit";
type RulesetExecutionMode =
  | "anyMatchedPass"
  | "allEvaluatedMatchedPass"
  | "eventPriorityDecision";

interface RuleRunLog {
  ruleId: string;
  ruleName: string;
  matched: boolean;
  skipped: boolean;
  skipReason: string;
  events: Array<Record<string, any>>;
  failureEvents: Array<Record<string, any>>;
  error: string;
}

interface RulesetDecision {
  status: string;
  detail: string;
  tagType: "success" | "warning" | "danger" | "info";
}

interface RulesetMeta {
  name: string;
  executionMode: RulesetExecutionMode;
}

interface RulesetPayload {
  ruleset?: Partial<RulesetMeta>;
  executionStrategy?: ExecutionStrategy;
  rules: Record<string, any>[];
}

const executionStrategyMap: Record<
  ExecutionStrategy,
  { label: string; desc: string }
> = {
  all: {
    label: "全部执行",
    desc: "从上到下执行全部规则，允许多个规则同时命中。"
  },
  priorityFirstHit: {
    label: "按优先级首个命中即停",
    desc: "按 priority 从高到低执行，命中第一条后停止后续规则。"
  },
  orderFirstHit: {
    label: "按配置顺序首个命中即停",
    desc: "按当前规则顺序执行，命中第一条后停止后续规则。"
  }
};

const executionStrategyOptions = [
  {
    value: "all",
    label: executionStrategyMap.all.label
  },
  {
    value: "priorityFirstHit",
    label: executionStrategyMap.priorityFirstHit.label
  },
  {
    value: "orderFirstHit",
    label: executionStrategyMap.orderFirstHit.label
  }
] as const;

const rulesetExecutionModeMap: Record<
  RulesetExecutionMode,
  { label: string; desc: string }
> = {
  anyMatchedPass: {
    label: "任一命中即通过",
    desc: "只要任意规则命中，规则集结果即为通过。"
  },
  allEvaluatedMatchedPass: {
    label: "全部命中才通过",
    desc: "所有已执行规则都命中时才通过，否则不通过。"
  },
  eventPriorityDecision: {
    label: "按事件优先级决策",
    desc: "按事件类型决策：拒绝 > 候补 > 通过（适合报名系统）。"
  }
};

const rulesetExecutionModeOptions = [
  {
    value: "eventPriorityDecision",
    label: rulesetExecutionModeMap.eventPriorityDecision.label
  },
  {
    value: "anyMatchedPass",
    label: rulesetExecutionModeMap.anyMatchedPass.label
  },
  {
    value: "allEvaluatedMatchedPass",
    label: rulesetExecutionModeMap.allEvaluatedMatchedPass.label
  }
] as const;

const rules = ref<RuleDraft[]>([createRuleDraft(1)]);
const activeRuleId = ref(rules.value[0].id);
const executionStrategy = ref<ExecutionStrategy>("all");
const rulesetMeta = ref<RulesetMeta>({
  name: "报名规则集",
  executionMode: "eventPriorityDecision"
});

const factsText = ref(`{
  "age": 19,
  "score": 83,
  "qualificationPassed": true,
  "seatsRemaining": 12,
  "signupDaysBeforeStart": 36,
  "paidAmount": 1200,
  "channel": "school",
  "isBlacklisted": false,
  "guardianConsent": true,
  "docsSubmitted": ["id", "photo", "agreement"]
}`);

const importText = ref("");
const running = ref(false);
const runLogs = ref<RuleRunLog[]>([]);
const lastRunAt = ref("");

const matchedCount = computed(
  () => runLogs.value.filter(item => item.matched).length
);

const evaluatedCount = computed(
  () => runLogs.value.filter(item => !item.skipped).length
);

const executionStrategyLabel = computed(
  () => executionStrategyMap[executionStrategy.value].label
);

const executionStrategyDesc = computed(
  () => executionStrategyMap[executionStrategy.value].desc
);

const rulesetExecutionModeLabel = computed(
  () => rulesetExecutionModeMap[rulesetMeta.value.executionMode].label
);

const rulesetExecutionModeDesc = computed(
  () => rulesetExecutionModeMap[rulesetMeta.value.executionMode].desc
);

const rulesetResult = computed<RulesetDecision>(() => {
  if (runLogs.value.length === 0) {
    return {
      status: "-",
      detail: "尚未执行规则集。",
      tagType: "info"
    };
  }

  const evaluatedLogs = runLogs.value.filter(
    item => !item.skipped && !item.error
  );
  const matchedLogs = evaluatedLogs.filter(item => item.matched);
  const matchedEventTypes = matchedLogs.flatMap(item =>
    item.events.map(event => String(event.type || ""))
  );

  if (rulesetMeta.value.executionMode === "anyMatchedPass") {
    const passed = matchedLogs.length > 0;
    return {
      status: passed ? "通过" : "不通过",
      detail: passed
        ? "规则集模式为“任一命中即通过”，当前至少命中一条规则。"
        : "规则集模式为“任一命中即通过”，当前无规则命中。",
      tagType: passed ? "success" : "danger"
    };
  }

  if (rulesetMeta.value.executionMode === "allEvaluatedMatchedPass") {
    const passed =
      evaluatedLogs.length > 0 && evaluatedLogs.every(item => item.matched);
    return {
      status: passed ? "通过" : "不通过",
      detail: passed
        ? "规则集模式为“全部命中才通过”，当前所有已执行规则均命中。"
        : "规则集模式为“全部命中才通过”，存在未命中规则。",
      tagType: passed ? "success" : "danger"
    };
  }

  const hasRejected = matchedEventTypes.some(
    type =>
      type.includes(".rejected") ||
      type.includes(".blocked") ||
      type.includes(".deny")
  );
  if (hasRejected) {
    return {
      status: "拒绝",
      detail: "规则集模式为“按事件优先级决策”，命中拒绝类事件。",
      tagType: "danger"
    };
  }

  const hasWaitlist = matchedEventTypes.some(type =>
    type.includes(".waitlist")
  );
  if (hasWaitlist) {
    return {
      status: "候补",
      detail: "规则集模式为“按事件优先级决策”，命中候补类事件。",
      tagType: "warning"
    };
  }

  const hasApproved = matchedEventTypes.some(
    type => type.includes(".approved") || type.includes(".pass")
  );
  if (hasApproved || matchedLogs.length > 0) {
    return {
      status: "通过",
      detail: "规则集模式为“按事件优先级决策”，命中通过类或普通命中事件。",
      tagType: "success"
    };
  }

  return {
    status: "未命中",
    detail: "规则集模式为“按事件优先级决策”，未命中有效事件。",
    tagType: "info"
  };
});

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

function isExecutionStrategy(value: unknown): value is ExecutionStrategy {
  return ["all", "priorityFirstHit", "orderFirstHit"].includes(String(value));
}

function isRulesetExecutionMode(value: unknown): value is RulesetExecutionMode {
  return [
    "anyMatchedPass",
    "allEvaluatedMatchedPass",
    "eventPriorityDecision"
  ].includes(String(value));
}

const previewText = computed(() => {
  try {
    const payload: RulesetPayload = {
      ruleset: {
        name: rulesetMeta.value.name,
        executionMode: rulesetMeta.value.executionMode
      },
      executionStrategy: executionStrategy.value,
      rules: rules.value.map(rule => toEngineRule(rule))
    };
    return JSON.stringify(payload, null, 2);
  } catch (error) {
    return `// 规则 JSON 生成失败：${(error as Error).message}`;
  }
});

function parseLooseValue(raw: string) {
  const source = raw.trim();
  if (!source) return "";
  if (source === "true") return true;
  if (source === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(source)) return Number(source);

  const isJsonLike =
    (source.startsWith("{") && source.endsWith("}")) ||
    (source.startsWith("[") && source.endsWith("]"));

  if (isJsonLike) {
    try {
      return JSON.parse(source);
    } catch {
      return source;
    }
  }

  return source;
}

function parseParamValue(param: {
  key: string;
  value: string;
  valueType: ParamValueType;
}) {
  const source = param.value.trim();

  switch (param.valueType) {
    case "number":
      if (!source || Number.isNaN(Number(source))) {
        throw new Error(`动作参数「${param.key || "未命名"}」不是有效数字`);
      }
      return Number(source);
    case "boolean":
      if (!["true", "false"].includes(source)) {
        throw new Error(
          `动作参数「${param.key || "未命名"}」布尔值只能是 true 或 false`
        );
      }
      return source === "true";
    case "json":
      try {
        return JSON.parse(source || "{}");
      } catch (error) {
        throw new Error(
          `动作参数「${param.key || "未命名"}」JSON 解析失败：${
            (error as Error).message
          }`
        );
      }
    default:
      return param.value;
  }
}

function toEngineRule(rule: RuleDraft): RuleProperties {
  const validConditions = rule.conditions
    .filter(item => item.fact.trim())
    .map(item => ({
      fact: item.fact.trim(),
      operator: item.operator,
      value: parseLooseValue(item.value)
    }));

  if (validConditions.length === 0) {
    throw new Error(`规则「${rule.name || "未命名"}」至少需要一个条件`);
  }

  const params: Record<string, unknown> = {};
  for (const item of rule.eventParams) {
    const key = item.key.trim();
    if (!key) continue;
    params[key] = parseParamValue(item);
  }

  return {
    name: rule.name.trim() || "未命名规则",
    priority: rule.priority || 1,
    conditions: {
      [rule.conditionLogic]: validConditions
    },
    event: {
      type: rule.eventType.trim() || "rule.matched",
      params
    }
  };
}

function parseFacts() {
  const parsed = JSON.parse(factsText.value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
    throw new Error("事实数据必须是 JSON 对象");
  }
  return parsed as Record<string, unknown>;
}

function toInputText(value: unknown) {
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null ||
    Array.isArray(value) ||
    typeof value === "object"
  ) {
    return JSON.stringify(value);
  }
  return "";
}

function detectParamType(value: unknown): ParamValueType {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (value !== null && typeof value === "object") return "json";
  return "string";
}

function engineRuleToDraft(raw: Record<string, any>, index: number): RuleDraft {
  const logic: ConditionLogic =
    Array.isArray(raw?.conditions?.all) || !Array.isArray(raw?.conditions?.any)
      ? "all"
      : "any";

  const sourceConditions = raw?.conditions?.[logic];
  const conditions = Array.isArray(sourceConditions)
    ? sourceConditions.map((item: Record<string, unknown>) => ({
        id: createId(),
        fact: String(item?.fact ?? ""),
        operator: String(item?.operator ?? "equal"),
        value: toInputText(item?.value)
      }))
    : [createConditionDraft()];

  const params = raw?.event?.params;
  const eventParams =
    params && typeof params === "object"
      ? Object.entries(params).map(([key, value]) => ({
          id: createId(),
          key,
          valueType: detectParamType(value),
          value: toInputText(value)
        }))
      : [];

  return {
    id: createId(),
    name: String(raw?.name || `导入规则 ${index + 1}`),
    description: "",
    priority: Number(raw?.priority || index + 1),
    conditionLogic: logic,
    conditions: conditions.length > 0 ? conditions : [createConditionDraft()],
    eventType: String(raw?.event?.type || "rule.matched"),
    eventParams:
      eventParams.length > 0 ? eventParams : [createEventParamDraft()]
  };
}

function fillImportFromCurrent() {
  importText.value = previewText.value;
}

function importRules() {
  if (!importText.value.trim()) {
    ElMessage.warning("请先输入要导入的规则 JSON");
    return;
  }
  try {
    const parsed = JSON.parse(importText.value);
    let rawRules: Record<string, any>[] = [];

    if (Array.isArray(parsed)) {
      rawRules = parsed;
    } else if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray(parsed.rules)
    ) {
      const payload = parsed as RulesetPayload;
      rawRules = payload.rules;

      if (payload.ruleset?.name) {
        rulesetMeta.value.name = String(payload.ruleset.name);
      }
      if (isRulesetExecutionMode(payload.ruleset?.executionMode)) {
        rulesetMeta.value.executionMode = payload.ruleset.executionMode;
      }
      if (isExecutionStrategy(payload.executionStrategy)) {
        executionStrategy.value = payload.executionStrategy;
      }
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
}

function loadDemo() {
  const demoRules: RuleDraft[] = [
    {
      id: createId(),
      name: "黑名单拦截",
      description: "黑名单用户直接拒绝报名",
      priority: 200,
      conditionLogic: "any",
      conditions: [
        {
          id: createId(),
          fact: "isBlacklisted",
          operator: "equal",
          value: "true"
        }
      ],
      eventType: "signup.rejected.blacklist",
      eventParams: [
        {
          id: createId(),
          key: "reason",
          valueType: "string",
          value: "blacklist"
        }
      ]
    },
    {
      id: createId(),
      name: "未成年监护拦截",
      description: "年龄小于18且监护同意缺失，拦截报名",
      priority: 180,
      conditionLogic: "all",
      conditions: [
        {
          id: createId(),
          fact: "age",
          operator: "lessThan",
          value: "18"
        },
        {
          id: createId(),
          fact: "guardianConsent",
          operator: "equal",
          value: "false"
        }
      ],
      eventType: "signup.rejected.guardian",
      eventParams: [
        {
          id: createId(),
          key: "reason",
          valueType: "string",
          value: "guardian-consent-required"
        }
      ]
    },
    {
      id: createId(),
      name: "名额不足进入候补",
      description: "名额耗尽时进入候补队列",
      priority: 150,
      conditionLogic: "all",
      conditions: [
        {
          id: createId(),
          fact: "seatsRemaining",
          operator: "lessThanInclusive",
          value: "0"
        }
      ],
      eventType: "signup.waitlist",
      eventParams: [
        {
          id: createId(),
          key: "queue",
          valueType: "string",
          value: "default-waitlist"
        }
      ]
    },
    {
      id: createId(),
      name: "报名资格通过",
      description: "年龄、资格、名额和分数满足时报名通过",
      priority: 100,
      conditionLogic: "all",
      conditions: [
        {
          id: createId(),
          fact: "age",
          operator: "greaterThanInclusive",
          value: "18"
        },
        {
          id: createId(),
          fact: "qualificationPassed",
          operator: "equal",
          value: "true"
        },
        {
          id: createId(),
          fact: "seatsRemaining",
          operator: "greaterThan",
          value: "0"
        },
        {
          id: createId(),
          fact: "score",
          operator: "greaterThanInclusive",
          value: "70"
        }
      ],
      eventType: "signup.approved",
      eventParams: [
        {
          id: createId(),
          key: "enrollType",
          valueType: "string",
          value: "normal"
        }
      ]
    },
    {
      id: createId(),
      name: "早鸟优惠",
      description: "提前报名且已支付时发放早鸟优惠",
      priority: 80,
      conditionLogic: "all",
      conditions: [
        {
          id: createId(),
          fact: "signupDaysBeforeStart",
          operator: "greaterThanInclusive",
          value: "30"
        },
        {
          id: createId(),
          fact: "paidAmount",
          operator: "greaterThan",
          value: "0"
        }
      ],
      eventType: "signup.discount.earlybird",
      eventParams: [
        {
          id: createId(),
          key: "discountRate",
          valueType: "number",
          value: "0.15"
        }
      ]
    },
    {
      id: createId(),
      name: "渠道激励",
      description: "校园或合作渠道报名，打上渠道标签",
      priority: 60,
      conditionLogic: "any",
      conditions: [
        {
          id: createId(),
          fact: "channel",
          operator: "in",
          value: '["school", "partner"]'
        }
      ],
      eventType: "signup.channel.bonus",
      eventParams: [
        {
          id: createId(),
          key: "tag",
          valueType: "string",
          value: "channel-priority"
        }
      ]
    }
  ];

  rules.value = demoRules;
  activeRuleId.value = demoRules[0].id;
  rulesetMeta.value = {
    name: "报名审核规则集",
    executionMode: "eventPriorityDecision"
  };
  executionStrategy.value = "all";
  factsText.value = `{
  "age": 19,
  "score": 83,
  "qualificationPassed": true,
  "seatsRemaining": 12,
  "signupDaysBeforeStart": 36,
  "paidAmount": 1200,
  "channel": "school",
  "isBlacklisted": false,
  "guardianConsent": true,
  "docsSubmitted": ["id", "photo", "agreement"]
}`;
  ElMessage.success("报名系统示例规则已加载（6条规则）");
}

async function runRules() {
  if (factsError.value) {
    ElMessage.error(`事实数据有误：${factsError.value}`);
    return;
  }

  const facts = parseFacts();
  running.value = true;

  try {
    const logs: RuleRunLog[] = [];
    const queue =
      executionStrategy.value === "priorityFirstHit"
        ? [...rules.value].sort((a, b) => b.priority - a.priority)
        : [...rules.value];

    const stopOnFirstHit = executionStrategy.value !== "all";
    let matchedAlready = false;

    for (const draft of queue) {
      if (stopOnFirstHit && matchedAlready) {
        logs.push({
          ruleId: draft.id,
          ruleName: draft.name || "未命名规则",
          matched: false,
          skipped: true,
          skipReason: `执行策略为「${executionStrategyLabel.value}」，前序规则已命中，当前规则跳过。`,
          events: [],
          failureEvents: [],
          error: ""
        });
        continue;
      }

      const log: RuleRunLog = {
        ruleId: draft.id,
        ruleName: draft.name || "未命名规则",
        matched: false,
        skipped: false,
        skipReason: "",
        events: [],
        failureEvents: [],
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
      } catch (error) {
        log.error = (error as Error).message;
      }

      logs.push(log);

      if (stopOnFirstHit && log.matched) {
        matchedAlready = true;
      }
    }

    runLogs.value = logs;
    lastRunAt.value = new Date().toLocaleString();
    ElMessage.success(`规则执行完成（${executionStrategyLabel.value}）`);
  } finally {
    running.value = false;
  }
}

function clearRunResult() {
  runLogs.value = [];
  lastRunAt.value = "";
}
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

.strategy-select {
  width: 220px;
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

.ruleset-form {
  margin-bottom: 8px;
}

.result-tip {
  padding: 8px 10px;
  margin-top: 8px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color-light);
  border-radius: 6px;
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

.run-item-skip {
  margin-top: 8px;
  color: var(--el-color-warning);
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
</style>
