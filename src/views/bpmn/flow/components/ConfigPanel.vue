<template>
  <div class="config-panel h-full flex flex-col bg-white">
    <!-- Panel Header -->
    <div
      class="panel-header px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0"
    >
      <span class="font-bold text-gray-700 text-sm">属性配置</span>
      <span v-if="selectedElement" class="text-xs text-gray-400 font-mono"
        >{{ selectedElement.id?.substring(0, 15) }}...</span
      >
    </div>

    <!-- Scrollable Content -->
    <div
      v-if="selectedElement"
      class="panel-content flex-1 overflow-y-auto custom-scrollbar p-5"
    >
      <el-form label-position="top" size="default" class="workflow-form">
        <!-- Base Information Group -->
        <div class="group-box mb-8">
          <div
            class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
          >
            <div class="w-1 h-3 bg-blue-500 rounded-full" />
            常规信息
          </div>

          <div class="grid gap-1">
            <el-form-item label="ID 标识">
              <el-input
                v-model="formData.id"
                placeholder="请输入唯一标识"
                @change="updateId"
              />
            </el-form-item>
            <el-form-item label="名称">
              <el-input
                v-model="formData.name"
                placeholder="请输入节点名称"
                @change="updateName"
              />
            </el-form-item>
            <el-form-item label="描述文档">
              <el-input
                v-model="formData.documentation"
                type="textarea"
                :rows="3"
                resize="none"
                placeholder="请输入节点描述..."
                @change="updateDocumentation"
              />
            </el-form-item>
          </div>
        </div>

        <!-- User Task Props -->
        <div v-if="formData.type === 'bpmn:UserTask'" class="group-box mb-8">
          <div
            class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
          >
            <div class="w-1 h-3 bg-orange-500 rounded-full" />
            任务配置
          </div>
          <el-form-item label="办理人">
            <template #label
              ><span class="text-gray-600">办理人 (Assignee)</span></template
            >
            <el-input
              v-model="formData.assignee"
              placeholder="指定办理人..."
              @change="updateProperty('assignee', $event)"
            />
          </el-form-item>
          <el-form-item>
            <template #label
              ><span class="text-gray-600"
                >候选用户 (Candidate Users)</span
              ></template
            >
            <el-input
              v-model="formData.candidateUsers"
              placeholder="逗号分隔用户..."
              @change="updateProperty('candidateUsers', $event)"
            />
          </el-form-item>
          <el-form-item>
            <template #label
              ><span class="text-gray-600"
                >候选组 (Candidate Groups)</span
              ></template
            >
            <el-input
              v-model="formData.candidateGroups"
              placeholder="逗号分隔组..."
              @change="updateProperty('candidateGroups', $event)"
            />
          </el-form-item>
          <div class="grid grid-cols-2 gap-3">
            <el-form-item label="到期时间">
              <el-input
                v-model="formData.dueDate"
                placeholder="ISO 8601..."
                @change="updateProperty('dueDate', $event)"
              />
            </el-form-item>
            <el-form-item label="优先级">
              <el-input
                v-model="formData.priority"
                placeholder="数值..."
                @change="updateProperty('priority', $event)"
              />
            </el-form-item>
          </div>
          <el-form-item label="跳过表达式">
            <el-input
              v-model="formData.skipExpression"
              placeholder="${skip}"
              @change="updateProperty('skipExpression', $event)"
            />
          </el-form-item>
        </div>

        <!-- Sequence Flow Props -->
        <div
          v-if="formData.type === 'bpmn:SequenceFlow'"
          class="group-box mb-8"
        >
          <div
            class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
          >
            <div class="w-1 h-3 bg-green-500 rounded-full" />
            流转条件
          </div>
          <el-form-item label="条件表达式">
            <el-input
              v-model="formData.conditionExpression"
              type="textarea"
              :rows="2"
              placeholder="${condition}"
              @change="updateCondition"
            />
          </el-form-item>
        </div>

        <!-- Service Task Props -->
        <div v-if="formData.type === 'bpmn:ServiceTask'" class="group-box mb-8">
          <div
            class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
          >
            <div class="w-1 h-3 bg-purple-500 rounded-full" />
            服务配置
          </div>
          <el-form-item label="服务类型">
            <el-select
              v-model="formData.serviceType"
              class="w-full"
              @change="handleServiceTypeChange"
            >
              <el-option label="Class" value="class" />
              <el-option
                label="Delegate Expression"
                value="delegateExpression"
              />
              <el-option label="Expression" value="expression" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="formData.serviceType" label="服务值">
            <el-input
              v-model="formData.serviceValue"
              placeholder="请输入类名或表达式"
              @change="updateServiceTask"
            />
          </el-form-item>
          <el-form-item label="结果变量">
            <el-input
              v-model="formData.resultVariableName"
              placeholder="resultVar"
              @change="updateProperty('resultVariableName', $event)"
            />
          </el-form-item>
        </div>

        <!-- Multi-instance -->
        <div
          v-if="
            ['bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:SubProcess'].includes(
              formData.type
            )
          "
          class="group-box mb-8"
        >
          <div
            class="group-title text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2"
          >
            <div class="w-1 h-3 bg-gray-600 rounded-full" />
            多实例设置
          </div>
          <el-form-item label="实例类型">
            <el-select
              v-model="formData.multiInstanceType"
              class="w-full"
              @change="updateMultiInstance"
            >
              <el-option label="无" value="none" />
              <el-option label="并行 (Parallel)" value="parallel" />
              <el-option label="串行 (Sequential)" value="sequential" />
            </el-select>
          </el-form-item>
          <div
            v-if="formData.multiInstanceType !== 'none'"
            class="bg-gray-50 p-3 rounded-md border border-gray-100"
          >
            <el-form-item label="集合 (Collection)" class="!mb-2">
              <el-input
                v-model="formData.collection"
                size="small"
                @change="updateMultiInstanceProps"
              />
            </el-form-item>
            <el-form-item label="元素变量 (Element Var)" class="!mb-2">
              <el-input
                v-model="formData.elementVariable"
                size="small"
                @change="updateMultiInstanceProps"
              />
            </el-form-item>
            <el-form-item label="完成条件" class="!mb-0">
              <el-input
                v-model="formData.completionCondition"
                size="small"
                placeholder="${nrOfCompletedInstances/nrOfInstances >= 0.6}"
                @change="updateMultiInstanceProps"
              />
            </el-form-item>
          </div>
        </div>
      </el-form>
    </div>

    <!-- Empty State -->
    <div
      v-else
      class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/30"
    >
      <div
        class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-8 w-8 text-gray-300"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
          />
        </svg>
      </div>
      <p class="text-sm font-medium text-gray-500">未选择元素</p>
      <p class="text-xs text-gray-400 mt-1">点击画布中的节点以配置其属性</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import BpmnModeler from "bpmn-js/lib/Modeler";
/**
 * 组件属性
 * @param {Object} modeler - bpmn-js 建模器实例
 */
interface Props {
  modeler: BpmnModeler;
}
const props = defineProps<Props>();

/**
 * 当前选中的 BPMN 元素
 */
const selectedElement = ref<any>(null);

/**
 * 表单数据模型
 * 包含 Flowable 扩展属性和标准 BPMN 属性
 */
const formData = ref<any>({
  id: "",
  name: "",
  documentation: "",
  type: "",
  // 用户任务相关
  assignee: "",
  candidateUsers: "",
  candidateGroups: "",
  dueDate: "",
  priority: "",
  skipExpression: "",
  // 连线相关
  conditionExpression: "",
  // 服务任务相关
  serviceType: "class",
  serviceValue: "",
  resultVariableName: "",
  // 多实例相关
  multiInstanceType: "none",
  collection: "",
  elementVariable: "",
  completionCondition: ""
});

/**
 * 获取元素的业务对象 (Business Object)
 * @param {any} element - 选中的元素
 * @returns {Object} 业务对象
 */
const getBusinessObject = (element: any) => {
  return element.businessObject;
};

/**
 * 初始化表单数据
 * 根据选中的元素类型和业务对象，回填表单
 * @param {any} element - 选中的元素
 */
const initFormData = (element: any) => {
  if (!element) return;
  const bo = getBusinessObject(element);

  // 检测多实例类型
  let miType = "none";
  if (bo.loopCharacteristics) {
    if (
      bo.loopCharacteristics.$type === "bpmn:MultiInstanceLoopCharacteristics"
    ) {
      miType = bo.loopCharacteristics.isSequential ? "sequential" : "parallel";
    }
  }

  // 填充表单数据
  formData.value = {
    id: bo.id,
    name: bo.name || "",
    documentation: bo.documentation?.[0]?.text || "",
    type: bo.$type,
    // Flowable 属性
    assignee: bo.assignee || "",
    candidateUsers: bo.candidateUsers || "",
    candidateGroups: bo.candidateGroups || "",
    dueDate: bo.dueDate || "",
    priority: bo.priority || "",
    skipExpression: bo.skipExpression || "",
    resultVariableName: bo.resultVariableName || "",
    // 服务任务
    serviceType: bo.class
      ? "class"
      : bo.delegateExpression
        ? "delegateExpression"
        : bo.expression
          ? "expression"
          : "class",
    serviceValue: bo.class || bo.delegateExpression || bo.expression || "",
    // 连线条件
    conditionExpression: bo.conditionExpression?.body || "",
    // 多实例
    multiInstanceType: miType,
    collection: bo.loopCharacteristics?.collection || "",
    elementVariable: bo.loopCharacteristics?.elementVariable || "",
    completionCondition: bo.loopCharacteristics?.completionCondition?.body || ""
  };
};

/**
 * 生命周期钩子：挂载完成
 * 监听模型器的事件
 */
onMounted(() => {
  if (props.modeler) {
    // 监听选择变化事件
    props.modeler.on("selection.changed", (e: any) => {
      const selection = e.newSelection;
      if (selection && selection.length === 1) {
        selectedElement.value = selection[0];
        initFormData(selectedElement.value);
      } else {
        selectedElement.value = null;
      }
    });

    // 监听元素改变事件
    props.modeler.on("element.changed", (e: any) => {
      if (e.element.id === selectedElement.value?.id) {
        // 如果需要同步外部更改到表单，可以在这里处理
      }
    });
  }
});

/**
 * 调用 bpmn-js API 更新模型属性
 * @param {Object} properties - 要更新的属性键值对
 */
const updateModeling = (properties: any) => {
  const modeling = props.modeler.get("modeling") as any;
  modeling.updateProperties(selectedElement.value, properties);
};

/**
 * 更新 ID
 */
const updateId = (val: string) => {
  updateModeling({ id: val });
};

/**
 * 更新名称
 */
const updateName = (val: string) => {
  updateModeling({ name: val });
};

/**
 * 更新文档 (Documentation)
 * 文档是 bpmn:Documentation 子元素
 */
const updateDocumentation = (val: string) => {
  const bpmnFactory = props.modeler.get("bpmnFactory") as any;
  const doc = bpmnFactory.create("bpmn:Documentation", { text: val });
  updateModeling({ documentation: [doc] });
};

/**
 * 通用属性更新方法
 * @param {string} key - 属性名
 * @param {string} val - 属性值
 */
const updateProperty = (key: string, val: string) => {
  const props: any = {};
  props[key] = val;
  updateModeling(props);
};

/**
 * 更新条件表达式 (Condition Expression)
 * 用于顺序流 (Sequence Flow)
 */
const updateCondition = (val: string) => {
  const moddle = props.modeler.get("moddle") as any;
  const newCondition = moddle.create("bpmn:FormalExpression", {
    body: val
  });
  updateModeling({ conditionExpression: newCondition });
};

/**
 * 处理服务任务类型变化
 */
const handleServiceTypeChange = () => {
  updateServiceTask(formData.value.serviceValue);
};

/**
 * 更新服务任务属性
 * 清除旧类型的属性，设置新类型的属性
 */
const updateServiceTask = (val: string) => {
  const type = formData.value.serviceType;
  const props: any = {
    class: undefined,
    delegateExpression: undefined,
    expression: undefined
  };
  props[type] = val;
  updateModeling(props);
};

/**
 * 更新多实例类型
 * 创建或删除 loopCharacteristics
 */
const updateMultiInstance = (val: string) => {
  const moddle = props.modeler.get("moddle") as any;
  let loopCharacteristics = undefined;

  if (val === "parallel" || val === "sequential") {
    loopCharacteristics = moddle.create(
      "bpmn:MultiInstanceLoopCharacteristics"
    );
    loopCharacteristics.isSequential = val === "sequential";
  }

  updateModeling({ loopCharacteristics });

  if (val !== "none") {
    updateMultiInstanceProps();
  }
};

/**
 * 更新多实例的具体属性
 * 集合、循环基数、元素变量、完成条件等
 */
const updateMultiInstanceProps = () => {
  if (formData.value.multiInstanceType === "none") return;

  const moddle = props.modeler.get("moddle") as any;
  const bo = getBusinessObject(selectedElement.value);

  if (!bo.loopCharacteristics) {
    return;
  }

  const { collection, elementVariable, completionCondition } = formData.value;

  bo.loopCharacteristics.collection = collection;
  bo.loopCharacteristics.elementVariable = elementVariable;

  if (completionCondition) {
    bo.loopCharacteristics.completionCondition = moddle.create(
      "bpmn:FormalExpression",
      { body: completionCondition }
    );
  } else {
    bo.loopCharacteristics.completionCondition = undefined;
  }

  // 显式触发更新
  updateModeling({ loopCharacteristics: bo.loopCharacteristics });
};
</script>

<style scoped lang="scss">
/* Custom Scrollbar */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #e2e8f0;
  border-radius: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #4b5563; /* text-gray-600 */
}
</style>
