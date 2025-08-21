import { ETriggerNodeHandlerName, TTriggerNodeHandlerName } from "@plane/types";

export type TAutomationTriggerIconKey = "LayersIcon" | "DoubleCircleIcon" | "Users" | "MessageCircle";

export type TAutomationTriggerSelectOption = {
  iconKey: TAutomationTriggerIconKey;
  label: string;
  readableLabel: string;
  value: TTriggerNodeHandlerName;
};

export const AUTOMATION_TRIGGER_SELECT_OPTIONS: TAutomationTriggerSelectOption[] = [
  {
    iconKey: "LayersIcon",
    label: "Work item created",
    readableLabel: "A work item is created",
    value: ETriggerNodeHandlerName.RECORD_CREATED,
  },
  {
    iconKey: "LayersIcon",
    label: "Work item updated",
    readableLabel: "A work item is updated",
    value: ETriggerNodeHandlerName.RECORD_UPDATED,
  },
  {
    iconKey: "DoubleCircleIcon",
    label: "State changed",
    readableLabel: "The state of a work item changes",
    value: ETriggerNodeHandlerName.STATE_CHANGED,
  },
  {
    iconKey: "Users",
    label: "Assignee changed",
    readableLabel: "The assignee of a work item changes",
    value: ETriggerNodeHandlerName.ASSIGNEE_CHANGED,
  },
  {
    iconKey: "MessageCircle",
    label: "Comment created",
    readableLabel: "A comment is added",
    value: ETriggerNodeHandlerName.COMMENT_CREATED,
  },
];
