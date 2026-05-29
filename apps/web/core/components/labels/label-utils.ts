import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import type { IIssueLabel, IPragmaticPayloadLocation, InstructionType, TDropTarget } from "@plane/types";

export type TargetData = {
  id: string;
  parentId: string | null;
  isGroup: boolean;
  isChild: boolean;
};

/**
 * extracts the Payload and translates the instruction for the current dropTarget based on drag and drop payload
 * @param dropTarget dropTarget for which the instruction is required
 * @param source the dragging label data that is being dragged on the dropTarget
 * @param location location includes the data of all the dropTargets the source is being dragged on
 * @returns Instruction for dropTarget
 */
export const getInstructionFromPayload = (
  dropTarget: TDropTarget,
  source: TDropTarget,
  location: IPragmaticPayloadLocation
): InstructionType | undefined => {
  const dropTargetData = dropTarget?.data as TargetData;
  const sourceData = source?.data as TargetData;

  const allDropTargets = location?.current?.dropTargets;

  // if all the dropTargets are greater than 1 meaning the source is being dragged on a group and its child at the same time
  // and also if the dropTarget in question is also a group then, it should be a child of the current Droptarget
  if (allDropTargets?.length > 1 && dropTargetData?.isGroup) return "make-child";

  if (!dropTargetData || !sourceData) return undefined;

  let instruction = extractInstruction(dropTargetData)?.type;

  // If the instruction is blocked then set an instruction based on if dropTarget it is a child or not
  if (instruction === "instruction-blocked") {
    instruction = dropTargetData.isChild ? "reorder-above" : "make-child";
  }

  // if source that is being dragged is a group. A group cannon be a child of any other label,
  // hence if current instruction is to be a child of dropTarget then reorder-above instead
  if (instruction === "make-child" && sourceData.isGroup) instruction = "reorder-above";

  return instruction;
};

/**
 * This provides a boolean to indicate if the label can be dropped onto the droptarget
 * @param source
 * @param label
 * @param isCurrentChild if the dropTarget is a child
 * @returns
 */
export const getCanDrop = (source: TDropTarget, label: IIssueLabel | undefined, isCurrentChild: boolean) => {
  const sourceData = source?.data;

  if (!sourceData) return false;

  // a label cannot be dropped on to itself and it's parent cannon be dropped on the child
  if (sourceData.id === label?.id || sourceData.id === label?.parent) return false;

  // if current dropTarget is a child and the label being dropped is a group then don't enable drop
  if (isCurrentChild && sourceData.isGroup) return false;

  return true;
};
