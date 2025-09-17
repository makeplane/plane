import { TFilterGroupNode, TFilterProperty } from "@plane/types";
import { processGroupNode } from "../../types/shared";
import { transformGroupWithChildren, TTreeTransformFn, TTreeTransformResult } from "./core";
import { transformNotGroup } from "./extended";

/**
 * Transforms groups by processing children.
 * Handles AND/OR groups with children and NOT groups with single child.
 * @param group - The group to transform
 * @param transformFn - The transformation function
 * @returns The transformation result
 */
export const transformGroup = <P extends TFilterProperty>(
  group: TFilterGroupNode<P>,
  transformFn: TTreeTransformFn<P>
): TTreeTransformResult<P> =>
  processGroupNode(group, {
    onNotGroup: (notGroup) => transformNotGroup(notGroup, transformFn),
    onAndGroup: (andGroup) => transformGroupWithChildren(andGroup, transformFn),
    onOrGroup: (orGroup) => transformGroupWithChildren(orGroup, transformFn),
  });
