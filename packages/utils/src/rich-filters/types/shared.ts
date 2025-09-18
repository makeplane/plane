// plane imports
import {
  TFilterAndGroupNode,
  TFilterExpression,
  TFilterGroupNode,
  TFilterNotGroupNode,
  TFilterOrGroupNode,
  TFilterProperty,
} from "@plane/types";
// local imports
import { getAndGroupChildren, isAndGroupNode } from "./core";
import { getNotGroupChild, getOrGroupChildren, isNotGroupNode, isOrGroupNode } from "./extended";

type TProcessGroupNodeHandlers<P extends TFilterProperty, T> = {
  onNotGroup: (group: TFilterNotGroupNode<P>) => T;
  onAndGroup: (group: TFilterAndGroupNode<P>) => T;
  onOrGroup: (group: TFilterOrGroupNode<P>) => T;
};

/**
 * Generic helper to process group nodes with type-safe handlers.
 * @param group - The group node to process
 * @param handlers - Object with handlers for each group type
 * @returns Result of the appropriate handler
 */
export const processGroupNode = <P extends TFilterProperty, T>(
  group: TFilterGroupNode<P>,
  handlers: TProcessGroupNodeHandlers<P, T>
): T => {
  if (isNotGroupNode(group)) {
    return handlers.onNotGroup(group);
  }
  if (isAndGroupNode(group)) {
    return handlers.onAndGroup(group);
  }
  if (isOrGroupNode(group)) {
    return handlers.onOrGroup(group);
  }
  throw new Error(`Invalid group node: unknown logical operator ${group}`);
};

/**
 * Gets the children of a group node, handling AND/OR groups (children array) and NOT groups (single child).
 * Uses processGroupNode for consistent group type handling.
 * @param group - The group node to get children from
 * @returns Array of child expressions
 */
export const getGroupChildren = <P extends TFilterProperty>(group: TFilterGroupNode<P>): TFilterExpression<P>[] =>
  processGroupNode(group, {
    onNotGroup: (notGroup) => [getNotGroupChild(notGroup)],
    onAndGroup: (andGroup) => getAndGroupChildren(andGroup),
    onOrGroup: (orGroup) => getOrGroupChildren(orGroup),
  });
