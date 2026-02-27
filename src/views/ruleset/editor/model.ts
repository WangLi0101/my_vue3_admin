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
  description: string;
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

export const createRuleDraft = (index: number): RuleDraft => ({
  id: createId(),
  name: `规则 ${index}`,
  description: "",
  priority: index,
  rootCondition: createConditionGroupDraft("all"),
  eventType: "rule.matched",
  eventParams: [createEventParamDraft()]
});
