import type { TFilterGroupNode, TFilterProperty } from "@plane/types";
import { processGroupNode } from "../../types/shared";
import type { TTreeTransformFn, TTreeTransformResult } from "./core";
import { transformGroupWithChildren } from "./core";

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
    onAndGroup: (andGroup) => transformGroupWithChildren(andGroup, transformFn),
  });
