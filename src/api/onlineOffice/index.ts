import { http } from "@/utils/http";
const baseUrl = "http://localhost:3000";
export interface OnlineOfficeConfig {
  document: {
    fileType: string;
    key: string; // 文档版本的唯一标识符
    title: string;
    url: string; // OnlyOffice 下载文件的 URL
    permissions: {
      edit: boolean;
      download: boolean;
      print: boolean;
    };
  };
  documentType: string;
  editorConfig: {
    callbackUrl: string;
    lang?: string;
    mode: "edit" | "view";
    user: {
      id: string;
      name: string;
    };
  };

  documentServerUrl: string; // 传递给前端以加载 API 脚本
  token: string; // Security token
}
export function getConfig(fileId: string) {
  return http.request<OnlineOfficeConfig>(
    "get",
    `${baseUrl}/onlyoffice/config/${fileId}`
  );
}
