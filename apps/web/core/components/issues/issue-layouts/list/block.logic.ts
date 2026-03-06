/**
 * Determines wheter a pointer/drag event should be suppressed.
 * If user has any text selected. we avoid triggering drag behavior
 */
export function shouldSuppressEvent(selectionText: string | null): boolean {
  return !!selectionText && selectionText.length > 0;
}
/**
 * If the user has selected text, dragging is always disabled
 */
export function canDragBasedOnSelection(selectionText: string | null, isAllowed: boolean) {
  if (selectionText) return false;
  return isAllowed;
}

/**
 * Computes the next expand/collapse state for a list item
 */
export function nextExpandState(nestingLevel: number, isExpanded: boolean) {
  return nestingLevel >= 3 ? isExpanded : !isExpanded;
}

/**
 *  If dragging is allowed returns null
 *  Otherwise the message depends on edit permissions
 */
export function getDragDisallowedToast(canDrag: boolean, canEdit: boolean) {
  if (canDrag) return null;

  return {
    title: "Cannot move work item",
    message: canEdit
      ? "Drag and drop is disabled for the current grouping"
      : "You are not allowed to move this work item",
  };
}
