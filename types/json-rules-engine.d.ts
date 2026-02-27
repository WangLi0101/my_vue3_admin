declare module "json-rules-engine" {
  export interface RuleProperties {
    name?: string;
    priority?: number;
    conditions: Record<string, unknown>;
    event: {
      type: string;
      params?: Record<string, unknown>;
    };
  }

  export interface RuleResult {
    name: string;
    conditions: Record<string, any>;
    result: boolean;
  }

  export interface EngineRunResult {
    events: Array<Record<string, any>>;
    failureEvents: Array<Record<string, any>>;
    results: RuleResult[];
    failureResults: RuleResult[];
  }

  export class Engine {
    constructor(rules?: RuleProperties[]);
    addRule(rule: RuleProperties): void;
    on(event: string, callback: (...args: any[]) => void): void;
    run(facts?: Record<string, unknown>): Promise<EngineRunResult>;
  }
}
