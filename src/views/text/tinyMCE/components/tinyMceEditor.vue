<template>
  <div class="tiny-editor">
    <Editor
      :id="id"
      v-model="innerValue"
      :init="editorInit"
      :disabled="disabled"
      license-key="gpl"
      output-format="html"
      :onInit="handleInit"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Editor from "@tinymce/tinymce-vue";
import type {
  Editor as TinyMceEditorInstance,
  RawEditorOptions
} from "tinymce";

import "tinymce/tinymce";
import "tinymce/icons/default";
import "tinymce/models/dom";
import "tinymce/themes/silver";
import "tinymce/plugins/lists";
import "tinymce/plugins/link";
import "tinymce/plugins/table";
import "tinymce/plugins/code";
import "tinymce/plugins/fullscreen";
import "tinymce/plugins/autolink";
import "tinymce-i18n/langs8/zh-CN.js";
import "tinymce/skins/ui/oxide/skin.min.css";
import "tinymce/skins/content/default/content.min.css";

defineOptions({
  name: "TinyMceEditor"
});

interface Props {
  id: string;
  modelValue?: string;
  height?: number;
  placeholder?: string;
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  height: 600,
  placeholder: "请输入内容",
  disabled: false
});

const editorRef = ref<TinyMceEditorInstance>();

const innerValue = defineModel<string>("modelValue", {
  required: true
});

const editorInit: RawEditorOptions = {
  height: props.height,
  menubar: "edit view insert format table tools",
  branding: false,
  promotion: false,
  language: "zh-CN",
  plugins: " table code fullscreen autolink",
  toolbar:
    "undo redo | blocks fontfamily fontsize | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist | table | removeformat code fullscreen",
  table_toolbar:
    "tableprops tabledelete | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol | tablemergecells tablesplitcells",
  table_sizing_mode: "responsive",
  font_size_formats:
    "12px 13px 14px 15px 16px 18px 20px 24px 28px 32px 36px 48px",
  placeholder: props.placeholder,
  skin: false,
  content_css: false,
  content_style:
    "body { font-size: 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; } table { border-collapse: collapse; width: 100%; } table td, table th { border: 1px solid #dcdfe6; padding: 8px; } td[data-mce-selected], th[data-mce-selected] { background-color: rgba(180, 215, 255, 0.7) !important; outline: 2px solid #409eff !important; outline-offset: -2px; }",
  setup: (editor: TinyMceEditorInstance) => {
    editor.on("init", () => {
      editor.execCommand("FontSize", false, "12px");
    });
  }
};

const handleInit = (_event: unknown, editor: TinyMceEditorInstance) => {
  editorRef.value = editor;
};

const setHtml = (value: string) => {
  const editor = editorRef.value;
  if (!editor) return;
  const nextHtml = value || "";
  const currentHtml = editor.getContent({ format: "html" });
  if (currentHtml !== nextHtml) {
    editor.setContent(nextHtml);
  }
};

defineExpose({
  setHtml
});
</script>

<style lang="scss" scoped>
.tiny-editor {
  width: 100%;

  :deep(.tox-tinymce) {
    border-color: #dcdfe6;
    border-radius: 8px;
  }
}
</style>
