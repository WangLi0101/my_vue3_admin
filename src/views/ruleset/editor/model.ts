import type { RuleProperties } from "json-rules-engine";

export type ConditionLogic = "all" | "any";
export type ParamValueType = "string" | "number" | "boolean" | "json";

export interface ConditionLeafDraft {
  id: string;
  nodeType: "leaf";
  fact: string;
  operator: string;
  value: string;
}

export interface ConditionGroupDraft {
  id: string;
  nodeType: "group";
  logic: ConditionLogic;
  children: ConditionNodeDraft[];
}

export type ConditionNodeDraft = ConditionLeafDraft | ConditionGroupDraft;

export interface EventParamDraft {
  id: string;
  key: string;
  valueType: ParamValueType;
  value: string;
}

export interface RuleDraft {
  id: string;
  name: string;
  priority: number;
  rootCondition: ConditionGroupDraft;
  eventType: string;
  eventParams: EventParamDraft[];
}

export const operatorOptions = [
  { label: "等于（equal）", value: "equal" },
  { label: "不等于（notEqual）", value: "notEqual" },
  { label: "大于（greaterThan）", value: "greaterThan" },
  {
    label: "大于等于（greaterThanInclusive）",
    value: "greaterThanInclusive"
  },
  { label: "小于（lessThan）", value: "lessThan" },
  { label: "小于等于（lessThanInclusive）", value: "lessThanInclusive" },
  { label: "包含（contains）", value: "contains" },
  { label: "不包含（doesNotContain）", value: "doesNotContain" },
  { label: "在集合中（in）", value: "in" },
  { label: "不在集合中（notIn）", value: "notIn" }
] as const;

export const paramTypeOptions = [
  { label: "字符串", value: "string" },
  { label: "数字", value: "number" },
  { label: "布尔值", value: "boolean" },
  { label: "JSON", value: "json" }
] as const;

export const createId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const createConditionDraft = (): ConditionLeafDraft => ({
  id: createId(),
  nodeType: "leaf",
  fact: "",
  operator: "equal",
  value: ""
});

export const createConditionGroupDraft = (
  logic: ConditionLogic = "all",
  children: ConditionNodeDraft[] = [createConditionDraft()]
): ConditionGroupDraft => ({
  id: createId(),
  nodeType: "group",
  logic,
  children
});

export const createEventParamDraft = (): EventParamDraft => ({
  id: createId(),
  key: "",
  valueType: "string",
  value: ""
});

/**
 * 将原始值转换为输入框文本
 * @param value 原始值
 * @returns 输入框文本
 */
const toInputText = (value: unknown) => {
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
};

export const createRuleDraft = (index: number): RuleDraft => ({
  id: createId(),
  name: `规则 ${index}`,
  priority: index,
  rootCondition: createConditionGroupDraft("all"),
  eventType: "rule.matched",
  eventParams: [createEventParamDraft()]
});

/**
 * 解析原始条件节点
 * @param raw 原始条件节点
 * @returns 草稿条件节点
 */
const parseRawConditionNode = (raw: unknown): ConditionNodeDraft | null => {
  if (!raw || typeof raw !== "object") return null;

  const node = raw as Record<string, any>;

  // 如果有 fact 和 operator 属性，说明是条件叶子节点
  if ("fact" in node && "operator" in node) {
    const leaf: ConditionLeafDraft = {
      ...createConditionDraft(),
      fact: String(node.fact ?? ""),
      operator: String(node.operator ?? "equal"),
      value: toInputText(node.value)
    };
    return leaf;
  }

  // 如果有 all 或 any 属性，说明是条件分组节点
  let logic: ConditionLogic | null = null;
  if (Array.isArray(node.all)) {
    logic = "all";
  } else if (Array.isArray(node.any)) {
    logic = "any";
  }

  if (!logic) return null;
  // 获取所有子节点
  const sourceChildren = Array.isArray(node[logic]) ? node[logic] : [];
  // 递归解析所有子节点
  const children = sourceChildren
    .map((item: unknown) => parseRawConditionNode(item))
    .filter(Boolean) as ConditionNodeDraft[];

  return createConditionGroupDraft(
    logic,
    children.length > 0 ? children : [createConditionDraft()]
  );
};

const detectParamType = (value: unknown): ParamValueType => {
  if (typeof value === "number") return "number";
  if (typeof value === "boolean") return "boolean";
  if (value !== null && typeof value === "object") return "json";
  return "string";
};

/**
 * 将引擎规则转换为草稿
 * @param raw 引擎规则
 * @param index 规则索引
 * @returns 草稿
 */
export const engineRuleToDraft = (
  raw: Partial<RuleProperties>,
  index: number
): RuleDraft => {
  const parsedCondition = parseRawConditionNode(raw?.conditions as unknown);
  const rootCondition =
    parsedCondition?.nodeType === "group"
      ? parsedCondition
      : createConditionGroupDraft("all");

  const eventRaw = raw?.event as Record<string, unknown> | undefined;
  const params = eventRaw?.params as Record<string, unknown> | undefined;
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
    priority: Number(raw?.priority || index + 1),
    rootCondition,
    eventType: String(eventRaw?.type || "rule.matched"),
    eventParams:
      eventParams.length > 0 ? eventParams : [createEventParamDraft()]
  };
};

const parseLooseValue = (raw: string) => {
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
};

const toEngineCondition = (
  node: ConditionNodeDraft
): Record<string, any> | null => {
  if (node.nodeType === "leaf") {
    if (!node.fact.trim()) return null;
    return {
      fact: node.fact.trim(),
      operator: node.operator,
      value: parseLooseValue(node.value)
    };
  }

  const children = node.children
    .map(child => toEngineCondition(child))
    .filter(Boolean) as Record<string, any>[];
  if (children.length === 0) return null;

  return {
    [node.logic]: children
  };
};
const parseParamValue = (param: {
  key: string;
  value: string;
  valueType: ParamValueType;
}) => {
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
};

/**
 * 将规则草稿转换为引擎规则
 * @param rule 规则草稿
 * @returns 引擎规则
 */
export const toEngineRule = (rule: RuleDraft): RuleProperties => {
  const parsedConditions = toEngineCondition(rule.rootCondition);
  if (!parsedConditions) {
    throw new Error(`规则「${rule.name || "未命名"}」至少需要一个有效条件`);
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
    conditions: parsedConditions,
    event: {
      type: rule.eventType.trim() || "rule.matched",
      params
    }
  };
};
