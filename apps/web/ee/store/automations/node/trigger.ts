// plane imports
import {
  EAutomationNodeType,
  TAutomationTriggerNodeConfig,
  TTriggerNodeHandlerName,
  TAutomationTriggerNode,
} from "@plane/types";
// local imports
import { AutomationBaseNode, IAutomationBaseNode, TAutomationBaseNodeHelpers } from "./base";

export type IAutomationTriggerNodeInstance = IAutomationBaseNode<
  EAutomationNodeType.TRIGGER,
  TTriggerNodeHandlerName,
  TAutomationTriggerNodeConfig
>;

export type TAutomationTriggerNodeHelpers = TAutomationBaseNodeHelpers<
  EAutomationNodeType.TRIGGER,
  TTriggerNodeHandlerName,
  TAutomationTriggerNodeConfig
>;

export class AutomationTriggerNodeInstance
  extends AutomationBaseNode<EAutomationNodeType.TRIGGER, TTriggerNodeHandlerName, TAutomationTriggerNodeConfig>
  implements IAutomationTriggerNodeInstance
{
  constructor(node: TAutomationTriggerNode, helpers: TAutomationTriggerNodeHelpers) {
    super(node, helpers);
  }
}
