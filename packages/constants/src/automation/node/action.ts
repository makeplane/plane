import { EActionNodeHandlerName, TActionNodeHandlerName } from "@plane/types";

export type TAutomationActionHandlerIconKey = "message-circle" | "circle-chevron-down";

export type TAutomationActionHandlerOption = {
  value: TActionNodeHandlerName;
  labelI18nKey: string;
  iconKey: TAutomationActionHandlerIconKey;
};

export const AUTOMATION_ACTION_HANDLER_OPTIONS: TAutomationActionHandlerOption[] = [
  {
    value: EActionNodeHandlerName.ADD_COMMENT,
    labelI18nKey: "automations.action.handler_name.add_comment",
    iconKey: "message-circle",
  },
  {
    value: EActionNodeHandlerName.CHANGE_PROPERTY,
    labelI18nKey: "automations.action.handler_name.change_property",
    iconKey: "circle-chevron-down",
  },
];
