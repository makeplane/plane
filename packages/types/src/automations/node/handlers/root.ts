import { TActionNodeHandlerName } from "./action";
import { TConditionNodeHandlerName } from "./condition";
import { TTriggerNodeHandlerName } from "./trigger";

export type TAutomationNodeHandlerName = TTriggerNodeHandlerName | TConditionNodeHandlerName | TActionNodeHandlerName;
