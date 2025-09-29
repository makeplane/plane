// plane imports
import { TFilterGroupNode, TFilterProperty } from "@plane/types";
// local imports
import { isNotGroupNode } from "../types/extended";
import { getGroupChildren } from "../types/shared";

/**
 * Determines if a group should be unwrapped based on the number of children and group type.
 * @param group - The group node to check
 * @param preserveNotGroups - Whether to preserve NOT groups even with single children
 * @returns True if the group should be unwrapped, false otherwise
 */
export const shouldUnwrapGroup = <P extends TFilterProperty>(group: TFilterGroupNode<P>, preserveNotGroups = true) => {
  const children = getGroupChildren(group);

  // Never unwrap groups with multiple children
  if (children.length !== 1) {
    return false;
  }

  // If preserveNotGroups is true, don't unwrap NOT groups
  if (preserveNotGroups && isNotGroupNode(group)) {
    return false;
  }

  // Unwrap AND/OR groups with single children, and NOT groups if preserveNotGroups is false
  return true;
};
