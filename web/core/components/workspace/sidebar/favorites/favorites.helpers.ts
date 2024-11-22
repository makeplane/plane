import { extractInstruction } from "@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item";
import orderBy from "lodash/orderBy";
import { IFavorite, InstructionType, IPragmaticPayloadLocation, TDropTarget } from "@plane/types";

export type TargetData = {
  id: string;
  parentId: string | null;
  isGroup: boolean;
  isChild: boolean;
}

export const getDestinationStateSequence = (
  favoriteMap: Record<string, IFavorite>,
  destinationId: string,
  edge: string | undefined
) => {
  const defaultSequence = 65535;
  if (!edge) return defaultSequence;


  const favoriteIds = orderBy(Object.values(favoriteMap), "sequence", "desc")
    .filter((fav: IFavorite) => !fav.parent)
    .map((fav: IFavorite) => fav.id);
  const destinationStateIndex = favoriteIds.findIndex((id) => id === destinationId);
  const destinationStateSequence = favoriteMap[destinationId]?.sequence || undefined;

  if (!destinationStateSequence) return defaultSequence;


  let resultSequence = defaultSequence;
  if (edge === "reorder-above") {
    const prevStateSequence = favoriteMap[favoriteIds[destinationStateIndex - 1]]?.sequence || undefined;

    if (prevStateSequence === undefined) {
      resultSequence =  destinationStateSequence + defaultSequence;
    }else {
      resultSequence = (destinationStateSequence + prevStateSequence) / 2
    }
  } else if (edge === "reorder-below") {
    const nextStateSequence = favoriteMap[favoriteIds[destinationStateIndex + 1]]?.sequence || undefined;

    if (nextStateSequence === undefined) {
      resultSequence = destinationStateSequence - defaultSequence;
    } else {
      resultSequence = (destinationStateSequence + nextStateSequence) / 2;
    }
  }

  console.log({resultSequence});

  resultSequence = Math.round(resultSequence)

  return resultSequence;
};

/**
 * extracts the Payload and translates the instruction for the current dropTarget based on drag and drop payload
 * @param dropTarget dropTarget for which the instruction is required
 * @param source the dragging favorite data that is being dragged on the dropTarget
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

  // if source that is being dragged is a group. A group cannon be a child of any other favorite,
  // hence if current instruction is to be a child of dropTarget then reorder-above instead
  if (instruction === "make-child" && sourceData.isGroup) instruction = "reorder-above";

  return instruction;
};

/**
 * This provides a boolean to indicate if the favorite can be dropped onto the droptarget
 * @param source
 * @param favorite
 * @param isCurrentChild if the dropTarget is a child
 * @returns
 */
export const getCanDrop = (source: TDropTarget, favorite: IFavorite | undefined, isCurrentChild: boolean) => {
  const sourceData = source?.data;

  if (!sourceData) return false;

  // a favorite cannot be dropped on to itself
  if (sourceData.id === favorite?.id ) return false;


  // if current dropTarget is a child and the favorite being dropped is a group then don't enable drop
  if (isCurrentChild && sourceData.isGroup) return false;

  return true;
};