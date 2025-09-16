import { EAutomationChangePropertyType } from "@plane/types";

/**
 * Get the label for a change property type
 * @param property_name - The property name to get the label for
 * @returns The label for the property name
 */
export const getAutomationChangePropertyTypeLabel = (property_name: EAutomationChangePropertyType): string => {
  const labelMap: Map<EAutomationChangePropertyType, string> = new Map([
    [EAutomationChangePropertyType.STATE, "State"],
    [EAutomationChangePropertyType.PRIORITY, "Priority"],
    [EAutomationChangePropertyType.ASSIGNEE, "Assignee"],
    [EAutomationChangePropertyType.LABELS, "Labels"],
    [EAutomationChangePropertyType.START_DATE, "Start Date"],
    [EAutomationChangePropertyType.DUE_DATE, "Due Date"],
  ]);

  return labelMap.get(property_name) || "--";
};
