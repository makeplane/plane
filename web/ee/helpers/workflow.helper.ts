import { TWorkflowChangeHistoryFields, TWorkflowChangeHistoryKeys, TWorkflowChangeHistoryVerbs } from "../types";

// Get the key for the issue property type based on the property type and relation type
export const getWorkflowChangeHistoryKey = (
  changeHistoryField: TWorkflowChangeHistoryFields | undefined,
  changeHistoryVerb: TWorkflowChangeHistoryVerbs
) => `${changeHistoryField ? `${changeHistoryField}_` : ""}${changeHistoryVerb}` as TWorkflowChangeHistoryKeys;
