/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { ECollectionAccess, EPageAccess, EUserWorkspaceRoles } from "@plane/types";
import type { TCollection, TPage, TPageCollection } from "@plane/types";
import { PageCollectionService } from "@plane/services";
import { CollectionStore } from "./collection.store";
import { WorkspacePageService } from "@/services/page/workspace-page.service";
import type { RootStore } from "@/plane-web/store/root.store";
import { WorkspacePageStore } from "./workspace-page.store";

const createCollection = (overrides: Partial<TCollection> = {}): TCollection => ({
  id: "collection-1",
  name: "Collection",
  owned_by_id: "user-1",
  access: ECollectionAccess.PUBLIC,
  is_default: false,
  is_global: true,
  logo_props: {},
  sort_order: 10000,
  workspace: "workspace-1",
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  created_by: "user-1",
  updated_by: "user-1",
  ...overrides,
});

const createPageCollection = (overrides: Partial<TPageCollection> = {}): TPageCollection => ({
  id: "page-collection-1",
  collection: "collection-a",
  page: "page-1",
  workspace: "workspace-1",
  sort_order: 10000,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  created_by: "user-1",
  updated_by: "user-1",
  ...overrides,
});

const createPage = (overrides: Partial<TPage> = {}): TPage =>
  ({
    id: "page-1",
    name: "Page",
    access: EPageAccess.PUBLIC,
    archived_at: null,
    color: undefined,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    created_by: "user-1",
    description_json: {},
    description_html: "<p></p>",
    is_description_empty: true,
    is_favorite: false,
    is_locked: false,
    label_ids: [],
    owned_by: "user-1",
    parent_id: null,
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_by: "user-1",
    workspace: "workspace-1",
    logo_props: {},
    deleted_at: undefined,
    moved_to_page: null,
    moved_to_project: null,
    shared_access: null,
    is_shared: false,
    collaborators: [],
    sub_pages_count: 0,
    team: null,
    anchor: null,
    sort_order: 10000,
    sharedUsers: [],
    ...overrides,
  }) as TPage;

const createDeferred = <T>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;

  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

const createRootStore = () => {
  const rootStore = {
    router: {
      workspaceSlug: "plane",
    },
    workspaceRoot: {
      currentWorkspace: {
        id: "workspace-1",
      },
      getWorkspaceById: vi.fn(() => ({
        slug: "plane",
      })),
    },
    user: {
      data: {
        id: "user-1",
      },
      permission: {
        allowPermissions: vi.fn(() => true),
        getWorkspaceRoleByWorkspaceSlug: vi.fn(() => EUserWorkspaceRoles.ADMIN),
      },
    },
  } as unknown as RootStore;

  const store = new WorkspacePageStore(rootStore);
  const collectionStore = new CollectionStore(rootStore);
  (rootStore as RootStore & { workspacePages: WorkspacePageStore; collection: CollectionStore }).workspacePages = store;
  (rootStore as RootStore & { workspacePages: WorkspacePageStore; collection: CollectionStore }).collection =
    collectionStore;

  return { rootStore, store, collectionStore };
};

describe("WorkspacePageStore", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("moves a nested page across collections and updates the live tree as a child of the target page", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Source root", sub_pages_count: 1, sort_order: 10000 }),
      createPage({ id: "page-2", name: "Moved child", parent_id: "page-1", sort_order: 12000 }),
      createPage({ id: "page-3", name: "Target root", sub_pages_count: 0, sort_order: 10000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
      createCollection({ id: "collection-b", name: "Collection B" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([createPageCollection({ id: "pc-a", collection: "collection-a", page: "page-1" })]);
      }
      if (collectionId === "collection-b") {
        return Promise.resolve([createPageCollection({ id: "pc-b", collection: "collection-b", page: "page-3" })]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");
    await collectionStore.fetchCollectionPages("plane", "collection-b");

    collectionStore.setCollectionSidebarRowExpanded("collection-a", "page-2");

    vi.spyOn(PageCollectionService.prototype, "create").mockImplementation((_workspaceSlug, collectionId, payload) =>
      Promise.resolve([
        createPageCollection({
          id: "pc-moved",
          collection: collectionId,
          page: payload.page_ids[0],
          sort_order: payload.sort_orders?.[payload.page_ids[0]] ?? 20000,
        }),
      ])
    );
    vi.spyOn(WorkspacePageService.prototype, "update").mockResolvedValue(
      createPage({ id: "page-2", parent_id: "page-3" })
    );

    await collectionStore.movePageWithCollectionContext({
      pageId: "page-2",
      sourceCollectionId: "collection-a",
      targetCollectionId: "collection-b",
      targetParentId: "page-3",
    });

    expect(store.getPageById("page-2")?.parent_id).toBe("page-3");
    expect([...collectionStore.getCollectionViewPageIds("collection-a")]).toEqual(["page-1"]);
    expect([...collectionStore.getCollectionViewPageIds("collection-b")].sort()).toEqual(["page-2", "page-3"]);
    expect(collectionStore.getCollectionChildPageIds("page-3", "collection-b")).toEqual(["page-2"]);
    expect(collectionStore.getCollectionAutoExpandedAncestorIds("collection-b", "page-2")).toEqual(["page-3"]);
  });

  it("moves a page across collections directly into a target sibling position", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Moved page", sort_order: 10000 }),
      createPage({ id: "page-2", name: "Existing first target page", sort_order: 10000 }),
      createPage({ id: "page-3", name: "Existing second target page", sort_order: 20000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
      createCollection({ id: "collection-b", name: "Collection B" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([
          createPageCollection({ id: "pc-a", collection: "collection-a", page: "page-1", sort_order: 10000 }),
        ]);
      }
      if (collectionId === "collection-b") {
        return Promise.resolve([
          createPageCollection({ id: "pc-b-1", collection: "collection-b", page: "page-2", sort_order: 10000 }),
          createPageCollection({ id: "pc-b-2", collection: "collection-b", page: "page-3", sort_order: 20000 }),
        ]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");
    await collectionStore.fetchCollectionPages("plane", "collection-b");

    const createSpy = vi
      .spyOn(PageCollectionService.prototype, "create")
      .mockImplementation((_workspaceSlug, collectionId, payload) =>
        Promise.resolve([
          createPageCollection({
            id: "pc-moved",
            collection: collectionId,
            page: payload.page_ids[0],
            sort_order: payload.sort_orders?.[payload.page_ids[0]] ?? 0,
          }),
        ])
      );
    const updateSpy = vi
      .spyOn(PageCollectionService.prototype, "update")
      .mockResolvedValue(
        createPageCollection({ id: "pc-moved", collection: "collection-b", page: "page-1", sort_order: 0 })
      );

    await collectionStore.movePageWithCollectionContext({
      pageId: "page-1",
      sourceCollectionId: "collection-a",
      targetCollectionId: "collection-b",
      targetParentId: null,
      reorderTargetPageId: "page-2",
      reorderPosition: "before",
    });

    expect(createSpy).toHaveBeenCalledWith("plane", "collection-b", {
      page_ids: ["page-1"],
      sort_orders: { "page-1": 0 },
    });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(collectionStore.getEffectiveCollectionId("page-1")).toBe("collection-b");
    expect(collectionStore.getPageCollectionByPageId("page-1")?.sort_order).toBe(0);
    expect(collectionStore.getCollectionRootPageIds("collection-b", {})).toEqual(["page-1", "page-2", "page-3"]);
  });

  it("optimistically places a cross-collection move in its final target position before the API resolves", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Moved page", sort_order: 10000 }),
      createPage({ id: "page-2", name: "Existing first target page", sort_order: 10000 }),
      createPage({ id: "page-3", name: "Existing second target page", sort_order: 20000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
      createCollection({ id: "collection-b", name: "Collection B" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([
          createPageCollection({ id: "pc-a", collection: "collection-a", page: "page-1", sort_order: 10000 }),
        ]);
      }
      if (collectionId === "collection-b") {
        return Promise.resolve([
          createPageCollection({ id: "pc-b-1", collection: "collection-b", page: "page-2", sort_order: 10000 }),
          createPageCollection({ id: "pc-b-2", collection: "collection-b", page: "page-3", sort_order: 20000 }),
        ]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");
    await collectionStore.fetchCollectionPages("plane", "collection-b");

    let resolveCreate!: (value: TPageCollection[]) => void;
    const createPromise = new Promise<TPageCollection[]>((resolve) => {
      resolveCreate = resolve;
    });

    vi.spyOn(PageCollectionService.prototype, "create").mockReturnValue(createPromise);
    const updateSpy = vi
      .spyOn(PageCollectionService.prototype, "update")
      .mockResolvedValue(
        createPageCollection({ id: "pc-moved", collection: "collection-b", page: "page-1", sort_order: 0 })
      );

    const movePromise = collectionStore.movePageWithCollectionContext({
      pageId: "page-1",
      sourceCollectionId: "collection-a",
      targetCollectionId: "collection-b",
      targetParentId: null,
      reorderTargetPageId: "page-2",
      reorderPosition: "before",
    });

    expect(collectionStore.getEffectiveCollectionId("page-1")).toBe("collection-b");
    expect(collectionStore.getPageCollectionByPageId("page-1")?.sort_order).toBe(0);
    expect(collectionStore.getCollectionRootPageIds("collection-b", {})).toEqual(["page-1", "page-2", "page-3"]);
    expect(updateSpy).not.toHaveBeenCalled();

    resolveCreate([
      createPageCollection({
        id: "pc-moved",
        collection: "collection-b",
        page: "page-1",
        sort_order: 0,
      }),
    ]);

    await movePromise;
  });

  it("optimistically promotes a same-collection child page to the root in its final position before the APIs resolve", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Parent", sub_pages_count: 1, sort_order: 10000 }),
      createPage({ id: "page-2", name: "Moved child", parent_id: "page-1", sort_order: 12000 }),
      createPage({ id: "page-3", name: "Existing root", sort_order: 20000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([
          createPageCollection({ id: "pc-a-parent", collection: "collection-a", page: "page-1", sort_order: 10000 }),
          createPageCollection({ id: "pc-a-root", collection: "collection-a", page: "page-3", sort_order: 20000 }),
        ]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");

    const deferredCreate = createDeferred<TPageCollection[]>();
    const deferredUpdate = createDeferred<TPage>();

    const createSpy = vi.spyOn(PageCollectionService.prototype, "create").mockReturnValue(deferredCreate.promise);
    vi.spyOn(WorkspacePageService.prototype, "update").mockReturnValue(deferredUpdate.promise);

    const movePromise = collectionStore.movePageWithCollectionContext({
      pageId: "page-2",
      sourceCollectionId: "collection-a",
      targetCollectionId: "collection-a",
      targetParentId: null,
      reorderTargetPageId: "page-3",
      reorderPosition: "before",
    });

    expect(store.getPageById("page-2")?.parent_id).toBeUndefined();
    expect(collectionStore.getPageCollectionByPageId("page-2")?.sort_order).toBe(15000);
    expect(collectionStore.getCollectionRootPageIds("collection-a", {})).toEqual(["page-1", "page-2", "page-3"]);
    expect(collectionStore.getCollectionChildPageIds("page-1", "collection-a")).toEqual([]);

    deferredCreate.resolve([
      createPageCollection({
        id: "pc-a-child",
        collection: "collection-a",
        page: "page-2",
        sort_order: 15000,
      }),
    ]);
    deferredUpdate.resolve(createPage({ id: "page-2", parent_id: null }));

    await movePromise;

    expect(createSpy).toHaveBeenCalledWith("plane", "collection-a", {
      page_ids: ["page-2"],
      sort_orders: { "page-2": 15000 },
    });
  });

  it("optimistically promotes a same-collection child page into sibling order before the APIs resolve", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Existing root", sort_order: 10000, sub_pages_count: 1 }),
      createPage({ id: "page-2", name: "Moved child", parent_id: "page-1", sort_order: 12000 }),
      createPage({ id: "page-3", name: "Later root", sort_order: 20000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([
          createPageCollection({ id: "pc-a-root-1", collection: "collection-a", page: "page-1", sort_order: 10000 }),
          createPageCollection({ id: "pc-a-root-2", collection: "collection-a", page: "page-3", sort_order: 20000 }),
        ]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");

    const deferredCreate = createDeferred<TPageCollection[]>();
    const deferredUpdate = createDeferred<TPage>();

    vi.spyOn(PageCollectionService.prototype, "create").mockReturnValue(deferredCreate.promise);
    vi.spyOn(WorkspacePageService.prototype, "update").mockReturnValue(deferredUpdate.promise);

    const movePromise = collectionStore.movePageWithCollectionContext({
      pageId: "page-2",
      sourceCollectionId: "collection-a",
      targetCollectionId: "collection-a",
      targetParentId: null,
      reorderTargetPageId: "page-1",
      reorderPosition: "before",
    });

    expect(store.getPageById("page-2")?.parent_id).toBeUndefined();
    expect(collectionStore.getPageCollectionByPageId("page-2")?.sort_order).toBe(0);
    expect(collectionStore.getCollectionRootPageIds("collection-a", {})).toEqual(["page-2", "page-1", "page-3"]);

    deferredCreate.resolve([
      createPageCollection({
        id: "pc-a-child",
        collection: "collection-a",
        page: "page-2",
        sort_order: 0,
      }),
    ]);
    deferredUpdate.resolve(createPage({ id: "page-2", parent_id: null }));

    await movePromise;
  });

  it("optimistically moves a page across collections to the root before the API resolves", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Moved page", sort_order: 10000 }),
      createPage({ id: "page-2", name: "Existing target root", sort_order: 10000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
      createCollection({ id: "collection-b", name: "Collection B" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([
          createPageCollection({ id: "pc-a", collection: "collection-a", page: "page-1", sort_order: 10000 }),
        ]);
      }
      if (collectionId === "collection-b") {
        return Promise.resolve([
          createPageCollection({ id: "pc-b", collection: "collection-b", page: "page-2", sort_order: 10000 }),
        ]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");
    await collectionStore.fetchCollectionPages("plane", "collection-b");

    const deferredCreate = createDeferred<TPageCollection[]>();
    vi.spyOn(PageCollectionService.prototype, "create").mockReturnValue(deferredCreate.promise);

    const movePromise = collectionStore.movePageWithCollectionContext({
      pageId: "page-1",
      sourceCollectionId: "collection-a",
      targetCollectionId: "collection-b",
      targetParentId: null,
    });

    expect(collectionStore.getEffectiveCollectionId("page-1")).toBe("collection-b");
    expect(collectionStore.getCollectionRootPageIds("collection-b", {})).toEqual(["page-2", "page-1"]);

    deferredCreate.resolve([
      createPageCollection({
        id: "pc-b-new",
        collection: "collection-b",
        page: "page-1",
        sort_order: 20000,
      }),
    ]);

    await movePromise;
  });

  it("optimistically moves a page across collections into a nested target before the APIs resolve", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Moved page", sort_order: 10000 }),
      createPage({ id: "page-2", name: "Target parent", sort_order: 10000, sub_pages_count: 1 }),
      createPage({ id: "page-3", name: "Existing child", parent_id: "page-2", sort_order: 15000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
      createCollection({ id: "collection-b", name: "Collection B" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([
          createPageCollection({ id: "pc-a", collection: "collection-a", page: "page-1", sort_order: 10000 }),
        ]);
      }
      if (collectionId === "collection-b") {
        return Promise.resolve([
          createPageCollection({ id: "pc-b-parent", collection: "collection-b", page: "page-2", sort_order: 10000 }),
        ]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");
    await collectionStore.fetchCollectionPages("plane", "collection-b");

    const deferredCreate = createDeferred<TPageCollection[]>();
    const deferredUpdate = createDeferred<TPage>();

    vi.spyOn(PageCollectionService.prototype, "create").mockReturnValue(deferredCreate.promise);
    vi.spyOn(WorkspacePageService.prototype, "update").mockReturnValue(deferredUpdate.promise);

    const movePromise = collectionStore.movePageWithCollectionContext({
      pageId: "page-1",
      sourceCollectionId: "collection-a",
      targetCollectionId: "collection-b",
      targetParentId: "page-2",
    });

    expect(store.getPageById("page-1")?.parent_id).toBe("page-2");
    expect(collectionStore.getEffectiveCollectionId("page-1")).toBe("collection-b");
    expect(collectionStore.getCollectionChildPageIds("page-2", "collection-b")).toEqual(["page-3", "page-1"]);
    expect(collectionStore.getPageCollectionByPageId("page-1")?.sort_order).toBe(25000);

    deferredCreate.resolve([
      createPageCollection({
        id: "pc-b-new",
        collection: "collection-b",
        page: "page-1",
        sort_order: 25000,
      }),
    ]);
    deferredUpdate.resolve(createPage({ id: "page-1", parent_id: "page-2" }));

    await movePromise;
  });

  it("rolls back the optimistic cross-collection move when the collection update fails", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Moved page", sort_order: 10000 }),
      createPage({ id: "page-2", name: "Target parent", sort_order: 10000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
      createCollection({ id: "collection-b", name: "Collection B" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([
          createPageCollection({ id: "pc-a", collection: "collection-a", page: "page-1", sort_order: 10000 }),
        ]);
      }
      if (collectionId === "collection-b") {
        return Promise.resolve([
          createPageCollection({ id: "pc-b", collection: "collection-b", page: "page-2", sort_order: 10000 }),
        ]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");
    await collectionStore.fetchCollectionPages("plane", "collection-b");

    vi.spyOn(PageCollectionService.prototype, "create").mockRejectedValue(new Error("boom"));
    const workspaceUpdateSpy = vi
      .spyOn(WorkspacePageService.prototype, "update")
      .mockImplementation(async (_workspaceSlug, pageId, payload) => createPage({ id: pageId, ...payload }));

    await expect(
      collectionStore.movePageWithCollectionContext({
        pageId: "page-1",
        sourceCollectionId: "collection-a",
        targetCollectionId: "collection-b",
        targetParentId: "page-2",
      })
    ).rejects.toThrow("boom");

    expect(collectionStore.getEffectiveCollectionId("page-1")).toBe("collection-a");
    expect(store.getPageById("page-1")?.parent_id).toBeUndefined();
    expect(workspaceUpdateSpy).toHaveBeenNthCalledWith(1, "plane", "page-1", { parent_id: "page-2" });
    expect(workspaceUpdateSpy).toHaveBeenNthCalledWith(2, "plane", "page-1", { parent_id: null });
  });

  it("rolls back the optimistic collection move when the page update fails", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Moved page", sort_order: 10000 }),
      createPage({ id: "page-2", name: "Target parent", sort_order: 10000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
      createCollection({ id: "collection-b", name: "Collection B" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([
          createPageCollection({ id: "pc-a", collection: "collection-a", page: "page-1", sort_order: 10000 }),
        ]);
      }
      if (collectionId === "collection-b") {
        return Promise.resolve([
          createPageCollection({ id: "pc-b", collection: "collection-b", page: "page-2", sort_order: 10000 }),
        ]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");
    await collectionStore.fetchCollectionPages("plane", "collection-b");

    const createSpy = vi
      .spyOn(PageCollectionService.prototype, "create")
      .mockResolvedValue([
        createPageCollection({ id: "pc-b-new", collection: "collection-b", page: "page-1", sort_order: 20000 }),
      ]);
    const workspaceUpdateSpy = vi
      .spyOn(WorkspacePageService.prototype, "update")
      .mockRejectedValueOnce(new Error("boom"));

    await expect(
      collectionStore.movePageWithCollectionContext({
        pageId: "page-1",
        sourceCollectionId: "collection-a",
        targetCollectionId: "collection-b",
        targetParentId: "page-2",
      })
    ).rejects.toThrow("boom");

    expect(collectionStore.getEffectiveCollectionId("page-1")).toBe("collection-a");
    expect(store.getPageById("page-1")?.parent_id).toBeUndefined();
    expect(createSpy).not.toHaveBeenCalled();
    expect(workspaceUpdateSpy).toHaveBeenCalledTimes(1);
  });

  it("does not attempt a collection write when an inherited collection page move fails the page update", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Source root", sub_pages_count: 1, sort_order: 10000 }),
      createPage({ id: "page-2", name: "Inherited child", parent_id: "page-1", sub_pages_count: 1, sort_order: 12000 }),
      createPage({ id: "page-3", name: "Target root", sort_order: 10000 }),
    ]);

    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
      createCollection({ id: "collection-b", name: "Collection B" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return Promise.resolve([createPageCollection({ id: "pc-a", collection: "collection-a", page: "page-1" })]);
      }
      if (collectionId === "collection-b") {
        return Promise.resolve([createPageCollection({ id: "pc-b", collection: "collection-b", page: "page-3" })]);
      }

      return Promise.resolve([]);
    });

    await collectionStore.fetchCollectionPages("plane", "collection-a");
    await collectionStore.fetchCollectionPages("plane", "collection-b");

    const createSpy = vi
      .spyOn(PageCollectionService.prototype, "create")
      .mockResolvedValue([
        createPageCollection({ id: "pc-b-new", collection: "collection-b", page: "page-2", sort_order: 20000 }),
      ]);
    vi.spyOn(WorkspacePageService.prototype, "update").mockRejectedValueOnce(new Error("boom"));

    await expect(
      collectionStore.movePageWithCollectionContext({
        pageId: "page-2",
        sourceCollectionId: "collection-a",
        targetCollectionId: "collection-b",
        targetParentId: "page-3",
      })
    ).rejects.toThrow("boom");

    expect(createSpy).not.toHaveBeenCalled();
    expect(store.getPageById("page-2")?.parent_id).toBe("page-1");
    expect(collectionStore.getEffectiveCollectionId("page-2")).toBe("collection-a");
    expect([...collectionStore.getCollectionViewPageIds("collection-a")].sort()).toEqual(["page-1", "page-2"]);
    expect([...collectionStore.getCollectionViewPageIds("collection-b")]).toEqual(["page-3"]);
  });

  it("does not let a stale collection fetch clear a newer explicit collection assignment", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([createPage({ id: "page-1", name: "Moved page" })]);
    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
    ]);

    let resolveCollectionList!: (value: TPageCollection[]) => void;
    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "collection-a") {
        return new Promise<TPageCollection[]>((resolve) => {
          resolveCollectionList = resolve;
        });
      }

      return Promise.resolve([]);
    });

    vi.spyOn(PageCollectionService.prototype, "create").mockResolvedValue([
      createPageCollection({ id: "pc-new", collection: "collection-a", page: "page-1" }),
    ]);

    const staleFetchPromise = collectionStore.fetchCollectionPages("plane", "collection-a");
    await collectionStore.addPageToCollection("plane", "page-1", "collection-a");

    resolveCollectionList([]);
    await staleFetchPromise;

    expect(collectionStore.getPageCollectionByPageId("page-1")?.collection).toBe("collection-a");
    expect(collectionStore.getEffectiveCollectionId("page-1")).toBe("collection-a");
    expect(collectionStore.getCollectionRootPageIds("collection-a", {})).toEqual(["page-1"]);
  });

  it("does not let stale membership hydration clear a newer explicit collection assignment", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([createPage({ id: "page-1", name: "Moved page" })]);
    collectionStore.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-a", name: "Collection A" }),
    ]);

    let resolveCollectionList!: (value: TPageCollection[]) => void;
    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation((_workspaceSlug, collectionId) => {
      if (collectionId === "general-collection") {
        return new Promise<TPageCollection[]>((resolve) => {
          resolveCollectionList = resolve;
        });
      }

      return Promise.resolve([]);
    });

    vi.spyOn(PageCollectionService.prototype, "create").mockResolvedValue([
      createPageCollection({ id: "pc-new", collection: "collection-a", page: "page-1" }),
    ]);

    const hydratePromise = collectionStore.ensureCollectionMembershipsHydrated("plane");
    await collectionStore.addPageToCollection("plane", "page-1", "collection-a");

    resolveCollectionList([]);
    await hydratePromise;

    expect(collectionStore.getPageCollectionByPageId("page-1")?.collection).toBe("collection-a");
    expect(collectionStore.getEffectiveCollectionId("page-1")).toBe("collection-a");
    expect(collectionStore.getCollectionRootPageIds("collection-a", {})).toEqual(["page-1"]);
  });

  it("restores the previous hierarchy when an internal move fails", async () => {
    const { store } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Parent", sub_pages_count: 1, sort_order: 10000 }),
      createPage({ id: "page-2", name: "Child", parent_id: "page-1", sort_order: 12000 }),
    ]);

    vi.spyOn(WorkspacePageService.prototype, "update").mockRejectedValue(new Error("boom"));

    await expect(store.movePageInternally("page-2", { parent_id: null })).rejects.toThrow("boom");

    expect(store.getPageById("page-2")?.parent_id).toBe("page-1");
    expect(store.getPageById("page-1")?.sub_pages_count).toBe(1);
  });

  it("does not double-apply parent counts when persisting an internal move", async () => {
    const { store } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Old parent", sub_pages_count: 1, sort_order: 10000 }),
      createPage({ id: "page-2", name: "Moved page", parent_id: "page-1", sort_order: 12000 }),
      createPage({ id: "page-3", name: "New parent", sub_pages_count: 0, sort_order: 14000 }),
    ]);

    vi.spyOn(WorkspacePageService.prototype, "update").mockResolvedValue(
      createPage({ id: "page-2", parent_id: "page-3" })
    );

    await store.movePageInternally("page-2", { parent_id: "page-3" });

    expect(store.getPageById("page-1")?.sub_pages_count).toBe(0);
    expect(store.getPageById("page-3")?.sub_pages_count).toBe(1);
    expect(store.getPageById("page-2")?.parent_id).toBe("page-3");
  });

  it("refreshes an existing cached page when explicitly requested", async () => {
    const { store } = createRootStore();

    store.updatePagesInStore([createPage({ id: "page-1", parent_id: "stale-parent" })]);

    const fetchByIdSpy = vi
      .spyOn(WorkspacePageService.prototype, "fetchById")
      .mockResolvedValue(createPage({ id: "page-1", parent_id: null }));
    vi.spyOn(WorkspacePageService.prototype, "fetchParentPages").mockResolvedValue([]);
    vi.spyOn(WorkspacePageService.prototype, "fetchSubPages").mockResolvedValue([]);

    const pageInstance = await store.getOrFetchPageInstance({
      pageId: "page-1",
      trackVisit: false,
      refreshIfExists: true,
    });

    expect(fetchByIdSpy).toHaveBeenCalledWith("plane", "page-1", false);
    expect(pageInstance).toBe(store.getPageById("page-1"));
    expect(store.getPageById("page-1")?.parent_id).toBeNull();
  });

  it("can refresh a page without fetching its sub-pages", async () => {
    const { store } = createRootStore();

    const fetchByIdSpy = vi
      .spyOn(WorkspacePageService.prototype, "fetchById")
      .mockResolvedValue(createPage({ id: "page-1" }));
    vi.spyOn(WorkspacePageService.prototype, "fetchParentPages").mockResolvedValue([]);
    const fetchSubPagesSpy = vi
      .spyOn(WorkspacePageService.prototype, "fetchSubPages")
      .mockResolvedValue([createPage({ id: "page-2", parent_id: "page-1" })]);

    const pageInstance = await store.getOrFetchPageInstance({
      pageId: "page-1",
      trackVisit: false,
      shouldFetchSubPages: false,
      refreshIfExists: true,
    });

    expect(fetchByIdSpy).toHaveBeenCalledWith("plane", "page-1", false);
    expect(fetchSubPagesSpy).not.toHaveBeenCalled();
    expect(pageInstance).toBe(store.getPageById("page-1"));
    expect(store.getPageById("page-2")).toBeUndefined();
  });

  it("invalidates cached parent chains when a page is moved", async () => {
    const { store } = createRootStore();

    store.updatePagesInStore([
      createPage({ id: "page-1", name: "Old parent", sort_order: 10000 }),
      createPage({ id: "page-2", name: "Moved page", parent_id: "page-1", sort_order: 12000 }),
      createPage({ id: "page-3", name: "New parent", sort_order: 14000 }),
    ]);

    const fetchParentPagesSpy = vi
      .spyOn(WorkspacePageService.prototype, "fetchParentPages")
      .mockResolvedValueOnce([
        createPage({ id: "page-1", name: "Old parent" }),
        createPage({ id: "page-2", name: "Moved page", parent_id: "page-1" }),
      ])
      .mockResolvedValueOnce([
        createPage({ id: "page-3", name: "New parent" }),
        createPage({ id: "page-2", name: "Moved page", parent_id: "page-3" }),
      ]);
    vi.spyOn(WorkspacePageService.prototype, "update").mockResolvedValue(
      createPage({ id: "page-2", parent_id: "page-3" })
    );

    await store.fetchParentPages("page-2");
    await store.movePageInternally("page-2", { parent_id: "page-3" });
    const parentPages = await store.fetchParentPages("page-2");

    expect(fetchParentPagesSpy).toHaveBeenCalledTimes(2);
    expect(parentPages?.map((page) => page.id)).toEqual(["page-3", "page-2"]);
  });

  it("deduplicates concurrent sub-page fetches for the same page", async () => {
    const { store } = createRootStore();

    store.updatePagesInStore([createPage({ id: "page-1", name: "Parent", sub_pages_count: 1, sort_order: 10000 })]);

    let resolveFetch: ((pages: TPage[]) => void) | undefined;
    const fetchSubPagesSpy = vi.spyOn(WorkspacePageService.prototype, "fetchSubPages").mockImplementation(
      () =>
        new Promise<TPage[]>((resolve) => {
          resolveFetch = resolve;
        })
    );

    const page = store.getPageById("page-1");
    expect(page).toBeDefined();

    const firstRequest = page?.fetchSubPages();
    const secondRequest = page?.fetchSubPages();

    expect(fetchSubPagesSpy).toHaveBeenCalledTimes(1);

    resolveFetch?.([createPage({ id: "page-2", name: "Child", parent_id: "page-1", sort_order: 12000 })]);

    await Promise.all([firstRequest, secondRequest]);

    expect(fetchSubPagesSpy).toHaveBeenCalledTimes(1);
    expect(store.getPageById("page-2")?.parent_id).toBe("page-1");
  });

  it("reconciles a stale sub-page count to the fetched sub-pages length", async () => {
    const { store } = createRootStore();

    store.updatePagesInStore([createPage({ id: "page-1", name: "Parent", sub_pages_count: 2, sort_order: 10000 })]);

    vi.spyOn(WorkspacePageService.prototype, "fetchSubPages").mockResolvedValue([
      createPage({ id: "page-2", name: "Child", parent_id: "page-1", sort_order: 12000 }),
    ]);

    await store.getPageById("page-1")?.fetchSubPages();

    expect(store.getPageById("page-1")?.sub_pages_count).toBe(1);
    expect(store.getPageById("page-2")?.parent_id).toBe("page-1");
  });

  it("removes a page from loaded collections immediately when it is made private", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([createPage({ id: "page-1", name: "Collection page" })]);
    collectionStore.updateCollectionsInStore([createCollection({ id: "collection-a", name: "Collection A" })]);

    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue([
      createPageCollection({ id: "pc-a", collection: "collection-a", page: "page-1" }),
    ]);
    vi.spyOn(WorkspacePageService.prototype, "updateAccess").mockResolvedValue(undefined);

    await collectionStore.fetchCollectionPages("plane", "collection-a");
    await store.getPageById("page-1")?.makePrivate({ shouldSync: true });

    expect(store.getPageById("page-1")?.access).toBe(EPageAccess.PRIVATE);
    expect(collectionStore.getPageCollectionByPageId("page-1")?.collection).toBe("collection-a");
    expect([...collectionStore.getCollectionViewPageIds("collection-a")]).toEqual([]);
    expect(collectionStore.getEffectiveCollectionId("page-1")).toBeUndefined();
  });

  it("shows the default collection immediately when a private page is made public after membership hydration", async () => {
    const { store, collectionStore } = createRootStore();

    store.updatePagesInStore([createPage({ id: "page-1", name: "Private page", access: EPageAccess.PRIVATE })]);
    collectionStore.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);

    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue([]);
    vi.spyOn(WorkspacePageService.prototype, "fetchAll").mockResolvedValue([]);
    vi.spyOn(WorkspacePageService.prototype, "updateAccess").mockResolvedValue(undefined);

    await collectionStore.fetchCollectionPages("plane", "general");
    await store.getPageById("page-1")?.makePublic({ shouldSync: true });

    expect(store.getPageById("page-1")?.access).toBe(EPageAccess.PUBLIC);
    expect(collectionStore.getPageCollectionByPageId("page-1")).toBeUndefined();
    expect(collectionStore.getEffectiveCollectionId("page-1")).toBe("general-collection");
    expect([...collectionStore.getCollectionViewPageIds("general")]).toEqual(["page-1"]);
  });
});
