// plane imports
import {
  EAutomationNodeType,
  TAutomationActionNodeConfig,
  TActionNodeHandlerName,
  TAutomationActionNode,
} from "@plane/types";
// local imports
import { AutomationBaseNode, IAutomationBaseNode, TAutomationBaseNodeHelpers } from "./base";

export type IAutomationActionNodeInstance = IAutomationBaseNode<
  EAutomationNodeType.ACTION,
  TActionNodeHandlerName,
  TAutomationActionNodeConfig
>;

export type TAutomationActionNodeHelpers = TAutomationBaseNodeHelpers<
  EAutomationNodeType.ACTION,
  TActionNodeHandlerName,
  TAutomationActionNodeConfig
>;

export class AutomationActionNodeInstance
  extends AutomationBaseNode<EAutomationNodeType.ACTION, TActionNodeHandlerName, TAutomationActionNodeConfig>
  implements IAutomationActionNodeInstance
{
  constructor(node: TAutomationActionNode, helpers: TAutomationActionNodeHelpers) {
    super(node, helpers);
  }
}
