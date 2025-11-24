import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import type { InstructionType, IPragmaticPayloadLocation, TDropTarget } from "@plane/types";

export type TargetData = {
  id: string;
  parentId: string | null;
  isGroup: boolean;
  isChild: boolean;
};

/**
 * extracts the Payload and translates the instruction for the current dropTarget based on drag and drop payload
 * @param dropTarget dropTarget for which the instruction is required
 * @param source the dragging sticky data that is being dragged on the dropTarget
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

  // if source that is being dragged is a group. A group cannon be a child of any other sticky,
  // hence if current instruction is to be a child of dropTarget then reorder-above instead
  if (instruction === "make-child" && sourceData.isGroup) instruction = "reorder-above";

  return instruction;
};
