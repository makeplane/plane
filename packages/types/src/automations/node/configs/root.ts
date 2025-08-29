import { TAutomationActionNodeConfig } from "./action";
import { TAutomationConditionNodeConfig } from "./condition";
import { TAutomationTriggerNodeConfig } from "./trigger";

export type TAutomationNodeConfig =
  | TAutomationTriggerNodeConfig
  | TAutomationActionNodeConfig
  | TAutomationConditionNodeConfig;
