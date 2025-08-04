import { ActionCondition } from "@/plane-live/types/common";
import { ConditionRegistry } from "../registries/condition-registry";
import { TPage } from "@plane/types";

export const isDeletedAndInDocument: ActionCondition = {
  name: "isDeletedAndInDocument",
  check: (page: TPage, isInDocument: boolean) => page.deleted_at != null && isInDocument,
};

export const isNewPageAndNotInDocument: ActionCondition = {
  name: "isNewPageAndNotInDocument",
  check: (page: TPage, isInDocument: boolean) =>
    page.deleted_at == null && !isInDocument && !page.moved_to_page && !page.moved_to_project,
};

export const isMovedPageButStillEmbed: ActionCondition = {
  name: "isMovedPageButStillEmbed",
  check: (page: TPage, isInDocument: boolean) =>
    page.moved_to_page != null && page.moved_to_project != null && isInDocument,
};

export const isInDocumentButNotInBackend: ActionCondition = {
  name: "isInDocumentButNotInBackend",
  check: (page: TPage, isInDocument: boolean, context: any) => {
    if (!context.embeddedIDs || !context.backendPageIds) return false;

    // This condition doesn't apply to regular processing of backend pages
    // It will be used in a special pass after all backend pages are processed
    return false;
  },
};

// Register standard conditions
ConditionRegistry.register(isDeletedAndInDocument);
ConditionRegistry.register(isNewPageAndNotInDocument);
ConditionRegistry.register(isMovedPageButStillEmbed);
ConditionRegistry.register(isInDocumentButNotInBackend);
