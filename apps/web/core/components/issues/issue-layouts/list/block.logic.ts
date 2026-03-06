export function shouldSuppressEvent(selectionText: string | null): boolean {
  return !!selectionText && selectionText.length > 0;
}

export function canDragBasedOnSelection(selectionText: string | null, isAllowed: boolean) {
  if (selectionText) return false;
  return isAllowed;
}

export function nextExpandState(nestingLevel: number, isExpanded: boolean) {
  return nestingLevel >= 3 ? isExpanded : !isExpanded;
}

export function getDragDisallowedToast(canDrag: boolean, canEdit: boolean) {
  if (canDrag) return null;

  return {
    title: "Cannot move work item",
    message: canEdit
      ? "Drag and drop is disabled for the current grouping"
      : "You are not allowed to move this work item",
  };
}
