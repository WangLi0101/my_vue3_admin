<template>
  <div
    class="bpmn-palette bg-white border-r border-gray-200 w-[200px] flex flex-col h-full bg-white z-20"
  >
    <div class="p-4 border-b border-gray-100">
      <h3 class="font-bold text-gray-700 text-sm">组件库</h3>
      <p class="text-xs text-gray-400 mt-1">拖拽组件到画布</p>
    </div>

    <div class="flex-1 overflow-y-auto p-3">
      <div v-for="(group, gIndex) in elementGroups" :key="gIndex" class="mb-4">
        <div class="text-xs font-semibold text-gray-500 mb-2 px-1">
          {{ group.name }}
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div
            v-for="(item, index) in group.items"
            :key="index"
            class="palette-item flex flex-col items-center justify-center p-2 rounded hover:bg-blue-50 cursor-grab active:cursor-grabbing border border-transparent hover:border-blue-100 transition-all group"
            @mousedown="onDragStart($event, item.type)"
          >
            <i
              :class="[
                'bpmn-icon-' + item.icon,
                'text-2xl text-gray-600 group-hover:text-blue-600 mb-1'
              ]"
            />
            <span
              class="text-xs text-center text-gray-600 group-hover:text-blue-700 leading-tight"
              >{{ item.label }}</span
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import BpmnModeler from "bpmn-js/lib/Modeler";

const props = defineProps<{
  modeler: BpmnModeler | null;
}>();

const elementGroups = [
  {
    name: "基础事件",
    items: [
      { type: "bpmn:StartEvent", label: "开始事件", icon: "start-event-none" },
      { type: "bpmn:EndEvent", label: "结束事件", icon: "end-event-none" }
    ]
  },
  {
    name: "任务",
    items: [
      { type: "bpmn:UserTask", label: "用户任务", icon: "user-task" },
      { type: "bpmn:ServiceTask", label: "服务任务", icon: "service-task" },
      { type: "bpmn:ScriptTask", label: "脚本任务", icon: "script-task" },
      { type: "bpmn:Task", label: "普通任务", icon: "task" }
    ]
  },
  {
    name: "网关",
    items: [
      { type: "bpmn:ExclusiveGateway", label: "排他网关", icon: "gateway-xor" },
      {
        type: "bpmn:ParallelGateway",
        label: "并行网关",
        icon: "gateway-parallel"
      },
      { type: "bpmn:InclusiveGateway", label: "包含网关", icon: "gateway-or" }
    ]
  },
  {
    name: "结构",
    items: [
      { type: "bpmn:SubProcess", label: "子流程", icon: "subprocess-expanded" }
    ]
  },
  {
    name: "高级任务",
    items: [
      { type: "bpmn:SendTask", label: "发送任务", icon: "send-task" },
      { type: "bpmn:ReceiveTask", label: "接收任务", icon: "receive-task" },
      {
        type: "bpmn:BusinessRuleTask",
        label: "规则任务",
        icon: "business-rule-task"
      }
    ]
  },
  {
    name: "中间事件",
    items: [
      {
        type: "bpmn:IntermediateThrowEvent",
        label: "投递事件",
        icon: "intermediate-event-none"
      },
      {
        type: "bpmn:IntermediateCatchEvent",
        label: "捕获事件",
        icon: "intermediate-event-catch-multiple"
      }
    ]
  },
  {
    name: "协作",
    items: [
      { type: "bpmn:Participant", label: "泳池/参与者", icon: "participant" }
    ]
  }
];

const onDragStart = (event: MouseEvent, type: string) => {
  if (!props.modeler) return;

  // Create the shape
  const elementFactory = props.modeler.get("elementFactory") as any;
  const create = props.modeler.get("create") as any;

  const shape = elementFactory.createShape({
    type: type
  });

  // Start the drag interaction
  create.start(event, shape);
};
</script>
