import sortBy from "lodash/sortBy";
import values from "lodash/values";
// plane imports
import {
  IStateTransition,
  IStateTransitionTree,
  TWorkflowChangeHistoryKeys,
  TWorkflowChangeHistoryFields,
  TWorkflowChangeHistoryVerbs,
} from "@plane/types";

/**
 * Get the key for the workflow change history based on the field and verb
 * @param changeHistoryField - The field of the change history
 * @param changeHistoryVerb - The verb of the change history
 * @returns The key for the workflow change history
 */
export const getWorkflowChangeHistoryKey = (
  changeHistoryField: TWorkflowChangeHistoryFields | undefined,
  changeHistoryVerb: TWorkflowChangeHistoryVerbs
) => `${changeHistoryField ? `${changeHistoryField}_` : ""}${changeHistoryVerb}` as TWorkflowChangeHistoryKeys;

/**
 * Converts an array of IStateTransition to an array of IStateTransitionTree
 * by merging transitions with identical approvers.
 *
 * @param transitions - Array of IStateTransition objects
 * @returns Array of IStateTransitionTree objects
 */
export function convertToStateTransitionTree(transitions: IStateTransition[]): IStateTransitionTree[] {
  // Create a map to track transitions by approvers
  const transitionMap: Record<string, IStateTransitionTree> = {};

  // Process each transition
  transitions.forEach((transition) => {
    // Sort approvers for consistent comparisons
    const sortedApprovers = sortBy(transition.approvers);
    // Create a key using the sorted approvers joined by a delimiter that won't appear in UUIDs
    const key = sortedApprovers.join("|");

    if (transitionMap[key]) {
      // If this approver set already exists, add this transition_state_id to the array
      transitionMap[key].transition_state_ids.push(transition.transition_state_id);
    } else {
      // Otherwise, create a new entry in the map
      transitionMap[key] = {
        transition_state_ids: [transition.transition_state_id],
        approvers: sortedApprovers,
      };
    }
  });

  // Convert the map values to an array
  return values(transitionMap);
}
