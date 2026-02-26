declare module "bpmn-js/lib/Modeler" {
  export default class BpmnModeler {
    constructor(options?: any);
    importXML(xml: string): Promise<{ warnings: any[] }>;
    saveXML(options?: any): Promise<{ xml: string }>;
    saveSVG(options?: any): Promise<{ svg: string }>;
    createDiagram(callback?: (err: any) => void): void;
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
    get<T = any>(name: string): T;
    destroy(): void;
  }
}

declare interface BusinessObject {
  id: string;
  name?: string;
  documentation?: { text: string }[];
  $type: string;
  [key: string]: any;
}

declare interface BpmnElement {
  id: string;
  type: string;
  businessObject: BusinessObject;
  [key: string]: any;
}

declare interface Modeling {
  updateProperties(element: BpmnElement, properties: Record<string, any>): void;
}

declare interface BpmnFactory {
  create(type: string, properties?: Record<string, any>): any;
}

declare interface Moddle {
  create(type: string, properties?: Record<string, any>): any;
}
