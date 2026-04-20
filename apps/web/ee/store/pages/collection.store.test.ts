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
import { ECollectionAccess, EPageAccess } from "@plane/types";
import type { TCollection, TCollectionBranchRow, TPageCollectionBranchResponse } from "@plane/types";
import { CollectionService, PageCollectionService } from "@plane/services";
import type { RootStore } from "@/plane-web/store/root.store";
import { CollectionStore } from "./collection.store";

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

const createBranchRow = (overrides: Partial<TCollectionBranchRow> = {}): TCollectionBranchRow => ({
  page_collection_id: "page-collection-1",
  collection_id: "general-collection",
  parent_id: null,
  sort_order: 10000,
  page: {
    id: "page-1",
    name: "Page",
    access: EPageAccess.PUBLIC,
    logo_props: { in_use: "icon" },
    is_locked: false,
    archived_at: undefined,
    parent_id: null,
    workspace: "workspace-1",
    sub_pages_count: 0,
    is_shared: false,
    shared_access: null,
    owned_by: "user-1",
    deleted_at: undefined,
    is_description_empty: true,
    updated_at: new Date("2026-01-01T00:00:00.000Z"),
    updated_by: "user-1",
    moved_to_page: null,
    moved_to_project: null,
    sort_order: 10000,
    created_at: new Date("2026-01-01T00:00:00.000Z"),
    created_by: "user-1",
    is_favorite: false,
    collection_id: "general-collection",
  },
  ...overrides,
});

const createBranchResponse = (
  overrides: Partial<TPageCollectionBranchResponse> = {}
): TPageCollectionBranchResponse => ({
  count: 1,
  extra_stats: null,
  next_cursor: "",
  next_page_results: false,
  prev_cursor: "",
  prev_page_results: false,
  total_pages: 1,
  total_results: 1,
  results: [createBranchRow()],
  ...overrides,
});

type TMockWorkspacePage = {
  id: string;
  name: string;
  isCurrentUserOwner: boolean;
  canCurrentUserEditPage: boolean;
  isContentEditable: boolean;
  parent_id: string | null;
  sort_order: number;
  sub_pages_count: number;
  archived_at: string | null;
  deleted_at: string | null;
  logo_props: Record<string, unknown>;
  access: number;
  workspace: string;
  is_shared: boolean;
  created_by: string;
  updated_by: string;
  subPageIds: string[];
  collection_id?: string;
  asJSON: Record<string, unknown>;
  mutateProperties: ReturnType<typeof vi.fn<(payload: Record<string, unknown>) => void>>;
  [key: string]: unknown;
};

const createWorkspacePage = (overrides: Partial<TMockWorkspacePage> = {}): TMockWorkspacePage => {
  const page: TMockWorkspacePage = {
    id: "page-1",
    name: "Page",
    isCurrentUserOwner: true,
    canCurrentUserEditPage: true,
    isContentEditable: true,
    parent_id: null,
    sort_order: 1000,
    sub_pages_count: 0,
    archived_at: null,
    deleted_at: null,
    logo_props: {},
    access: 0,
    workspace: "workspace-1",
    is_shared: false,
    created_by: "user-1",
    updated_by: "user-1",
    subPageIds: [],
    asJSON: {
      id: "page-1",
      name: "Page",
      parent_id: null,
      sort_order: 1000,
      sub_pages_count: 0,
      archived_at: null,
      deleted_at: null,
      logo_props: {},
      access: 0,
      workspace: "workspace-1",
      is_shared: false,
    },
    mutateProperties: vi.fn<(payload: Record<string, unknown>) => void>((payload) => {
      Object.assign(page, payload);
      page.asJSON = { ...page.asJSON, ...payload };
    }),
    ...overrides,
  };

  return page;
};

const createRootStore = (pages: Record<string, ReturnType<typeof createWorkspacePage>> = {}) =>
  ({
    router: {
      workspaceSlug: "plane",
    },
    workspaceRoot: {
      currentWorkspace: {
        id: "workspace-1",
      },
      getWorkspaceById: vi.fn(() => ({
        id: "workspace-1",
        slug: "plane",
      })),
    },
    user: {
      data: {
        id: "user-1",
      },
    },
    permissionAccessStore: {
      can: vi.fn(() => true),
    },
    workspacePages: {
      data: pages,
      getPageById: vi.fn((pageId: string) => pages[pageId]),
      getOrFetchPageInstance: vi.fn(({ pageId }: { pageId: string }) => Promise.resolve(pages[pageId])),
      fetchAllPages: vi.fn().mockResolvedValue(undefined),
      removePageInstance: vi.fn(),
      applyPageInternalUpdateLocally: vi.fn((pageId: string, updatePayload: Record<string, unknown>) => {
        const page = pages[pageId];
        const previousValues = Object.fromEntries(
          Object.keys(updatePayload).map((key) => [key, page?.[key as keyof typeof page]])
        );
        const previousUpdatedAt = page?.updated_at;
        const previousParentId = page?.parent_id ?? null;

        page?.mutateProperties(updatePayload);

        return {
          pageId,
          previousValues,
          previousUpdatedAt,
          previousParentId,
          nextParentId: page?.parent_id ?? null,
        };
      }),
      rollbackPageInternalUpdateLocally: vi.fn(
        (snapshot: { pageId: string; previousValues: Record<string, unknown> }) => {
          pages[snapshot.pageId]?.mutateProperties(snapshot.previousValues);
        }
      ),
      persistPageInternalUpdate: vi.fn((pageId: string, updatePayload: Record<string, unknown>) => {
        pages[pageId]?.mutateProperties(updatePayload);
        return Promise.resolve();
      }),
    },
  }) as unknown as RootStore;

describe("CollectionStore", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("passes search, filters, and cursors through the collection pages API", async () => {
    const rootStore = createRootStore();
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);

    const listSpy = vi
      .spyOn(PageCollectionService.prototype, "list")
      .mockResolvedValueOnce(
        createBranchResponse({
          total_pages: 2,
          total_results: 2,
          next_cursor: "50:1:0",
          next_page_results: true,
          results: [
            createBranchRow({
              page_collection_id: "pc-1",
              page: { ...createBranchRow().page, id: "page-1", name: "Alpha Root" },
            }),
          ],
        })
      )
      .mockResolvedValueOnce(
        createBranchResponse({
          total_pages: 2,
          total_results: 2,
          next_cursor: "50:2:0",
          results: [
            createBranchRow({
              page_collection_id: "pc-2",
              page: { ...createBranchRow().page, id: "page-2", name: "Alpha Next" },
              sort_order: 20000,
            }),
          ],
        })
      );

    await store.fetchCollectionPages("plane", "general", {
      searchQuery: "Alpha",
      filters: { favorites: true },
    });

    await store.fetchCollectionPages("plane", "general", {
      searchQuery: "Alpha",
      filters: { favorites: true },
      cursor: "50:1:0",
    });

    expect(listSpy).toHaveBeenNthCalledWith(1, "plane", "general-collection", {
      parent_id: null,
      search: "Alpha",
      filters: { favorites: true },
      cursor: undefined,
      per_page: 50,
    });
    expect(listSpy).toHaveBeenNthCalledWith(2, "plane", "general-collection", {
      parent_id: null,
      search: "Alpha",
      filters: { favorites: true },
      cursor: "50:1:0",
      per_page: 50,
    });
    expect(
      store.getCollectionBranchState("general", {
        parentId: null,
        searchQuery: "Alpha",
        filters: { favorites: true },
      })
    ).toMatchObject({
      pageIds: ["page-1", "page-2"],
      nextCursor: null,
      hasNextPage: false,
    });
  });

  it("loads missing pages before adding them to a collection", async () => {
    const pages: Record<string, ReturnType<typeof createWorkspacePage>> = {};
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-2" }),
    ]);

    const getOrFetchPageInstanceMock = vi.fn(({ pageId }: { pageId: string }) => {
      const page = createWorkspacePage({
        id: pageId,
        collection_id: "general-collection",
      });

      pages[pageId] = page;
      return Promise.resolve(page);
    });
    rootStore.workspacePages.getOrFetchPageInstance =
      getOrFetchPageInstanceMock as unknown as typeof rootStore.workspacePages.getOrFetchPageInstance;

    const createSpy = vi.spyOn(PageCollectionService.prototype, "create").mockResolvedValue([
      {
        id: "pc-1",
        collection: "collection-2",
        page: "page-1",
        workspace: "workspace-1",
        sort_order: 10000,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
        created_by: "user-1",
        updated_by: "user-1",
      },
    ]);

    await store.addPagesToCollection("plane", ["page-1"], "collection-2");

    expect(getOrFetchPageInstanceMock).toHaveBeenCalledWith({
      pageId: "page-1",
      trackVisit: false,
      shouldFetchParentPages: false,
      shouldFetchSubPages: false,
    });
    expect(createSpy).toHaveBeenCalledWith("plane", "collection-2", {
      page_ids: ["page-1"],
      sort_orders: { "page-1": 10000 },
    });
  });

  it("shows added pages at collection root when their workspace parent is outside the target collection", async () => {
    const pages = {
      "parent-1": createWorkspacePage({
        id: "parent-1",
        collection_id: "general-collection",
        asJSON: {
          id: "parent-1",
          name: "Parent",
          parent_id: null,
          sort_order: 1000,
          sub_pages_count: 1,
          archived_at: null,
          deleted_at: null,
          logo_props: {},
          access: 0,
          workspace: "workspace-1",
          is_shared: false,
          collection_id: "general-collection",
        },
      }),
      "page-1": createWorkspacePage({
        id: "page-1",
        parent_id: "parent-1",
        collection_id: "general-collection",
        asJSON: {
          id: "page-1",
          name: "Nested page",
          parent_id: "parent-1",
          sort_order: 1000,
          sub_pages_count: 0,
          archived_at: null,
          deleted_at: null,
          logo_props: {},
          access: 0,
          workspace: "workspace-1",
          is_shared: false,
          collection_id: "general-collection",
        },
      }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-2" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue(
      createBranchResponse({
        count: 0,
        total_pages: 0,
        total_results: 0,
        next_cursor: "",
        next_page_results: false,
        results: [],
      })
    );
    vi.spyOn(PageCollectionService.prototype, "create").mockResolvedValue([
      {
        id: "pc-1",
        collection: "collection-2",
        page: "page-1",
        workspace: "workspace-1",
        sort_order: 10000,
        created_at: new Date("2026-01-01T00:00:00.000Z"),
        updated_at: new Date("2026-01-01T00:00:00.000Z"),
        created_by: "user-1",
        updated_by: "user-1",
      },
    ]);

    await store.fetchCollectionPages("plane", "collection-2");
    await store.addPagesToCollection("plane", ["page-1"], "collection-2");

    expect(store.getCollectionRootPageIds("collection-2")).toEqual(["page-1"]);
    expect(store.getCollectionChildPageIds("parent-1", "collection-2")).toEqual([]);
    expect(store.pageParentIdByPageId.get("page-1")).toBeNull();
  });

  it("updates loaded page collection ids before deleting the source collection after a transfer", async () => {
    const page = createWorkspacePage({
      collection_id: "collection-1",
      access: EPageAccess.PUBLIC,
    });
    const rootStore = createRootStore({ "page-1": page });
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "collection-1" }),
      createCollection({ id: "collection-2" }),
    ]);

    vi.spyOn(CollectionService.prototype, "movePages").mockResolvedValue(undefined);
    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue(
      createBranchResponse({
        count: 0,
        total_pages: 0,
        total_results: 0,
        next_cursor: "",
        next_page_results: false,
        results: [],
      })
    );

    await store.moveCollectionPages("plane", "collection-1", "collection-2");

    expect(page.mutateProperties).toHaveBeenCalledWith({ collection_id: "collection-2" });
    expect(store.getCollectionById("collection-1")).toBeUndefined();
    expect(store.getEffectiveCollectionId("page-1")).toBe("collection-2");
  });

  it("keeps loaded child branch pages visible when a forced refresh comes back short", async () => {
    const parentPage = createWorkspacePage({
      id: "parent-page",
      name: "Parent page",
      collection_id: "collection-2",
      sub_pages_count: 1,
      asJSON: {
        id: "parent-page",
        name: "Parent page",
        parent_id: null,
        sort_order: 1000,
        sub_pages_count: 1,
        archived_at: null,
        deleted_at: null,
        logo_props: {},
        access: 0,
        workspace: "workspace-1",
        is_shared: false,
        collection_id: "collection-2",
      },
    });
    const childPage = createWorkspacePage({
      id: "page-1",
      parent_id: "parent-page",
      collection_id: "collection-2",
      asJSON: {
        id: "page-1",
        name: "Page",
        parent_id: "parent-page",
        sort_order: 1000,
        sub_pages_count: 0,
        archived_at: null,
        deleted_at: null,
        logo_props: {},
        access: 0,
        workspace: "workspace-1",
        is_shared: false,
        collection_id: "collection-2",
      },
    });
    const rootStore = createRootStore({
      "parent-page": parentPage,
      "page-1": childPage,
    });
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-2" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list")
      .mockResolvedValueOnce(
        createBranchResponse({
          results: [
            createBranchRow({
              page_collection_id: "pc-1",
              collection_id: "collection-2",
              parent_id: "parent-page",
              page: {
                ...createBranchRow().page,
                id: "page-1",
                parent_id: "parent-page",
                collection_id: "collection-2",
              },
            }),
          ],
        })
      )
      .mockResolvedValueOnce(
        createBranchResponse({
          count: 0,
          total_pages: 0,
          total_results: 0,
          next_cursor: "",
          next_page_results: false,
          results: [],
        })
      );

    await store.fetchCollectionBranchChildren("plane", "collection-2", "parent-page");
    const refreshedPageIds = await store.fetchCollectionBranch("plane", "collection-2", {
      parentId: "parent-page",
      force: true,
    });

    expect(refreshedPageIds).toEqual(["page-1"]);
    expect(store.getCollectionChildPageIds("parent-page", "collection-2")).toEqual(["page-1"]);
    expect(store.getCollectionBranchState("collection-2", { parentId: "parent-page" })).toMatchObject({
      pageIds: ["page-1"],
      isStale: true,
    });
  });

  it("refreshes a page branch from already-loaded collection membership", async () => {
    const rootPage = createWorkspacePage({
      id: "page-1",
      collection_id: "collection-2",
      asJSON: {
        id: "page-1",
        name: "Page",
        parent_id: null,
        sort_order: 1000,
        sub_pages_count: 0,
        archived_at: null,
        deleted_at: null,
        logo_props: {},
        access: 0,
        workspace: "workspace-1",
        is_shared: false,
        collection_id: "collection-2",
      },
    });
    const rootStore = createRootStore({ "page-1": rootPage });
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-2" }),
    ]);

    const listSpy = vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValueOnce(
      createBranchResponse({
        results: [
          createBranchRow({
            page_collection_id: "pc-1",
            collection_id: "collection-2",
            page: {
              ...createBranchRow().page,
              id: "page-1",
              parent_id: null,
              collection_id: "collection-2",
            },
          }),
        ],
      })
    );

    const collectionId = await store.refreshCollectionBranchForPage("plane", "page-1");

    expect(collectionId).toBe("collection-2");
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(listSpy).toHaveBeenCalledWith("plane", "collection-2", {
      parent_id: null,
      search: undefined,
      filters: undefined,
      cursor: undefined,
      per_page: 50,
    });
    expect(store.getCollectionRootPageIds("collection-2")).toEqual(["page-1"]);
  });

  it("marks loaded branches stale when page membership is unknown locally", async () => {
    const deepLinkedPage = createWorkspacePage({
      id: "deep-linked-page",
      collection_id: undefined,
      asJSON: {
        id: "deep-linked-page",
        name: "Deep linked page",
        parent_id: null,
        sort_order: 1000,
        sub_pages_count: 0,
        archived_at: null,
        deleted_at: null,
        logo_props: {},
        access: 0,
        workspace: "workspace-1",
        is_shared: false,
      },
    });
    const rootStore = createRootStore({ "deep-linked-page": deepLinkedPage });
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-2" }),
    ]);

    const listSpy = vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValueOnce(
      createBranchResponse({
        results: [
          createBranchRow({
            page_collection_id: "pc-1",
            collection_id: "collection-2",
            page: {
              ...createBranchRow().page,
              id: "page-1",
              parent_id: null,
              collection_id: "collection-2",
            },
          }),
        ],
      })
    );

    await store.fetchCollectionPages("plane", "collection-2");
    const collectionId = await store.refreshCollectionBranchForPage("plane", "deep-linked-page");

    expect(collectionId).toBeUndefined();
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(store.getCollectionBranchState("collection-2", { parentId: null })).toMatchObject({
      pageIds: ["page-1"],
      isStale: true,
    });
  });

  it("keeps loaded root branch pages visible when a forced refresh comes back short", async () => {
    const rootPage = createWorkspacePage({
      id: "page-1",
      collection_id: "collection-2",
      asJSON: {
        id: "page-1",
        name: "Page",
        parent_id: null,
        sort_order: 1000,
        sub_pages_count: 0,
        archived_at: null,
        deleted_at: null,
        logo_props: {},
        access: 0,
        workspace: "workspace-1",
        is_shared: false,
        collection_id: "collection-2",
      },
    });
    const rootStore = createRootStore({ "page-1": rootPage });
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "collection-2" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list")
      .mockResolvedValueOnce(
        createBranchResponse({
          results: [
            createBranchRow({
              page_collection_id: "pc-1",
              collection_id: "collection-2",
              page: {
                ...createBranchRow().page,
                id: "page-1",
                parent_id: null,
                collection_id: "collection-2",
              },
            }),
          ],
        })
      )
      .mockResolvedValueOnce(
        createBranchResponse({
          count: 0,
          total_pages: 0,
          total_results: 0,
          next_cursor: "",
          next_page_results: false,
          results: [],
        })
      );

    await store.fetchCollectionPages("plane", "collection-2");
    const refreshedPageIds = await store.fetchCollectionBranch("plane", "collection-2", {
      parentId: null,
      force: true,
    });

    expect(refreshedPageIds).toEqual(["page-1"]);
    expect(store.getCollectionRootPageIds("collection-2")).toEqual(["page-1"]);
    expect(store.getCollectionBranchState("collection-2", { parentId: null })).toMatchObject({
      pageIds: ["page-1"],
      isStale: true,
    });
  });
});
