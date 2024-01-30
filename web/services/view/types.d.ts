import { TView } from "@plane/types";

export type TViewService = {
  fetch: (workspaceSlug: string, projectId?: string) => Promise<TView[] | undefined>;
  fetchById: (workspaceSlug: string, viewId: string, projectId?: string) => Promise<TView | undefined>;
  create: (workspaceSlug: string, data: Partial<TView>, projectId?: string) => Promise<TView | undefined>;
  update: (
    workspaceSlug: string,
    viewId: string,
    data: Partial<TView>,
    projectId?: string
  ) => Promise<TView | undefined>;
  remove: (workspaceSlug: string, viewId: string, projectId?: string) => Promise<void> | undefined;
  lock: (workspaceSlug: string, viewId: string, projectId?: string) => Promise<TView | undefined>;
  unlock: (workspaceSlug: string, viewId: string, projectId?: string) => Promise<TView | undefined>;
  duplicate: (workspaceSlug: string, viewId: string, projectId?: string) => Promise<TView | undefined>;
  makeFavorite: (workspaceSlug: string, viewId: string, projectId?: string) => Promise<TView | undefined>;
  removeFavorite: (workspaceSlug: string, viewId: string, projectId?: string) => Promise<TView | undefined>;
};
