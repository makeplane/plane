import {
  TRecurringWorkItemActivityFields,
  TRecurringWorkItemActivityKeys,
  TRecurringWorkItemActivityVerbs,
} from "@plane/types";

/**
 * Get the key for the recurring work item activity based on the field and verb
 * @param recurringWorkItemActivityField - The field of the recurring work item activity
 * @param recurringWorkItemActivityVerb - The verb of the recurring work item activity
 * @returns The key for the recurring work item activity
 */
export const getRecurringWorkItemActivityKey = (
  recurringWorkItemActivityField: TRecurringWorkItemActivityFields | undefined,
  recurringWorkItemActivityVerb: TRecurringWorkItemActivityVerbs
) =>
  `${recurringWorkItemActivityField ? `${recurringWorkItemActivityField}_` : ""}${recurringWorkItemActivityVerb}` as TRecurringWorkItemActivityKeys;
