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
import type { TCollection, TPageCollection } from "@plane/types";
import { CollectionService, PageCollectionService } from "@plane/services";
import type { RootStore } from "@/plane-web/store/root.store";
import { CollectionStore } from "./collection.store";

type PageCollectionListArgs = Parameters<PageCollectionService["list"]>;

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
  collection: "general-collection",
  page: "page-1",
  workspace: "workspace-1",
  sort_order: 10000,
  created_at: new Date("2026-01-01T00:00:00.000Z"),
  updated_at: new Date("2026-01-01T00:00:00.000Z"),
  created_by: "user-1",
  updated_by: "user-1",
  ...overrides,
});

const createWorkspacePage = (overrides: Record<string, unknown> = {}) =>
  ({
    id: "page-1",
    name: "Page",
    isCurrentUserOwner: true,
    parent_id: null,
    sort_order: 1000,
    sub_pages_count: 0,
    archived_at: null,
    deleted_at: null,
    logo_props: {},
    access: 0,
    workspace: "workspace-1",
    is_shared: false,
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
    ...overrides,
  }) as any;

const createRootStore = (pages: Record<string, ReturnType<typeof createWorkspacePage>> = {}) =>
  ({
    router: {
      workspaceSlug: "plane",
    },
    workspaceRoot: {
      currentWorkspace: {
        id: "workspace-1",
      },
    },
    user: {
      data: {
        id: "user-1",
      },
      permission: {
        allowPermissions: vi.fn(() => true),
        getWorkspaceRoleByWorkspaceSlug: vi.fn(() => 20),
      },
    },
    workspacePages: {
      data: pages,
      getPageById: vi.fn((pageId: string) => pages[pageId]),
      getOrFetchPageInstance: vi.fn(async ({ pageId }: { pageId: string }) => pages[pageId]),
      fetchAllPages: vi.fn().mockResolvedValue(undefined),
    },
  }) as unknown as RootStore;

describe("CollectionStore", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("populates collections, sorts them, and resolves the default collection", async () => {
    const rootStore = createRootStore();
    const store = new CollectionStore(rootStore);
    const customCollection = createCollection({ id: "collection-a", sort_order: 20000 });
    const defaultCollection = createCollection({ id: "general-collection", is_default: true, sort_order: 10000 });

    vi.spyOn(CollectionService.prototype, "list").mockResolvedValue([customCollection, defaultCollection]);

    await store.fetchCollections("plane");

    expect(store.workspaceCollections?.map((collection) => collection.id)).toEqual([
      "general-collection",
      "collection-a",
    ]);
    expect(store.defaultCollectionId).toBe("general-collection");
    expect(store.getCollectionById("collection-a")?.name).toBe("Collection");
    expect(store.loader).toBeUndefined();
  });

  it("hydrates collection pages without prefetching parent or sub-pages", async () => {
    const pages = {} as Record<string, ReturnType<typeof createWorkspacePage>>;
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);
    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue([
      createPageCollection({ id: "page-collection-1", collection: "general-collection", page: "page-1" }),
    ]);

    await store.fetchCollectionPages("plane", "general");

    expect(rootStore.workspacePages.getOrFetchPageInstance).toHaveBeenCalledWith({
      pageId: "page-1",
      trackVisit: false,
      shouldFetchParentPages: false,
      shouldFetchSubPages: false,
    });
  });

  it("hydrates only collection roots on initial fetch when descendants are already in the membership payload", async () => {
    const rootStore = createRootStore();
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "custom-collection" })]);
    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue([
      {
        ...createPageCollection({ id: "pc-root", collection: "custom-collection", page: "page-1" }),
        parent_id: null,
      },
      {
        ...createPageCollection({ id: "pc-child", collection: "custom-collection", page: "page-2" }),
        parent_id: "page-1",
      },
    ]);

    await store.fetchCollectionPages("plane", "custom-collection");

    expect(rootStore.workspacePages.getOrFetchPageInstance).toHaveBeenCalledTimes(1);
    expect(rootStore.workspacePages.getOrFetchPageInstance).toHaveBeenCalledWith({
      pageId: "page-1",
      trackVisit: false,
      shouldFetchParentPages: false,
      shouldFetchSubPages: false,
    });
    expect(store.getCollectionRootPageIds("custom-collection")).toEqual(["page-1"]);
  });

  it("does not synthesize implicit workspace memberships before hydration completes", () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);

    expect(store.hasHydratedCollectionMemberships("plane")).toBe(false);
    expect(store.getPageCollectionByPageId("page-1")).toBeUndefined();
    expect([...store.getCollectionViewPageIds("general")]).toEqual([]);
  });

  it("fetches collection memberships and derives membership-aware roots", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null, asJSON: { id: "page-1", parent_id: null } }),
      "page-2": createWorkspacePage({
        id: "page-2",
        parent_id: "page-1",
        asJSON: { id: "page-2", parent_id: "page-1" },
      }),
      "page-3": createWorkspacePage({
        id: "page-3",
        parent_id: "missing-parent",
        asJSON: { id: "page-3", parent_id: "missing-parent" },
      }),
      "page-4": createWorkspacePage({ id: "page-4", parent_id: null, asJSON: { id: "page-4", parent_id: null } }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) => {
        if (collectionId !== "general-collection") return [];
        return [
          createPageCollection({ id: "pc-1", collection: "general-collection", page: "page-1" }),
          createPageCollection({ id: "pc-2", collection: "general-collection", page: "page-2" }),
          createPageCollection({ id: "pc-3", collection: "general-collection", page: "page-3" }),
        ];
      }
    );

    await store.ensureCollectionMembershipsHydrated("plane");

    expect([...store.getCollectionViewPageIds("general")].sort()).toEqual(["page-1", "page-2", "page-3", "page-4"]);
    expect([...store.getCollectionRootPageIds("general")].sort()).toEqual(["page-1", "page-3", "page-4"]);
    expect(store.pageCollectionIdByPageId.get("page-2")).toBe("pc-2");
  });

  it("includes fetched nested descendants in workspace collection hierarchy even when only parent is linked", async () => {
    const pages = {
      "page-1": createWorkspacePage({
        id: "page-1",
        parent_id: null,
        sub_pages_count: 1,
        subPageIds: ["page-2"],
        asJSON: { id: "page-1", parent_id: null, sub_pages_count: 1 },
      }),
      "page-2": createWorkspacePage({
        id: "page-2",
        parent_id: "page-1",
        access: EPageAccess.PUBLIC,
        is_shared: false,
        sub_pages_count: 0,
        subPageIds: [],
        asJSON: { id: "page-2", parent_id: "page-1", sub_pages_count: 0 },
      }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) => {
        if (collectionId !== "general-collection") return [];
        return [createPageCollection({ id: "pc-1", collection: "general-collection", page: "page-1" })];
      }
    );

    await store.ensureCollectionMembershipsHydrated("plane");

    expect([...store.getCollectionViewPageIds("general")].sort()).toEqual(["page-1", "page-2"]);
    expect([...store.getCollectionRootPageIds("general")]).toEqual(["page-1"]);
  });

  it("derives custom collection trees with nested descendants of linked pages", async () => {
    const pages = {
      "page-1": createWorkspacePage({
        id: "page-1",
        parent_id: null,
        sub_pages_count: 1,
        subPageIds: ["page-2"],
        asJSON: { id: "page-1", parent_id: null, sub_pages_count: 1 },
      }),
      "page-2": createWorkspacePage({
        id: "page-2",
        parent_id: "page-1",
        sub_pages_count: 1,
        subPageIds: ["page-3"],
        asJSON: { id: "page-2", parent_id: "page-1", sub_pages_count: 1 },
      }),
      "page-3": createWorkspacePage({
        id: "page-3",
        parent_id: "page-2",
        sub_pages_count: 0,
        subPageIds: [],
        asJSON: { id: "page-3", parent_id: "page-2", sub_pages_count: 0 },
      }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "custom-collection" })]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) => {
        if (collectionId !== "custom-collection") return [];
        return [createPageCollection({ id: "pc-1", collection: "custom-collection", page: "page-1" })];
      }
    );

    await store.fetchCollectionPages("plane", "custom-collection");

    expect([...store.getCollectionViewPageIds("custom-collection")].sort()).toEqual(["page-1", "page-2", "page-3"]);
    expect([...store.getCollectionRootPageIds("custom-collection")]).toEqual(["page-1"]);
  });

  it("includes nested descendants in custom collections even when they have implicit default memberships", async () => {
    const pages = {
      "page-1": createWorkspacePage({
        id: "page-1",
        parent_id: null,
        sub_pages_count: 1,
        subPageIds: ["page-2"],
        asJSON: { id: "page-1", parent_id: null, sub_pages_count: 1 },
      }),
      "page-2": createWorkspacePage({
        id: "page-2",
        parent_id: "page-1",
        sub_pages_count: 1,
        subPageIds: ["page-3"],
        asJSON: { id: "page-2", parent_id: "page-1", sub_pages_count: 1 },
      }),
      "page-3": createWorkspacePage({
        id: "page-3",
        parent_id: "page-2",
        sub_pages_count: 0,
        subPageIds: [],
        asJSON: { id: "page-3", parent_id: "page-2", sub_pages_count: 0 },
      }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "custom-collection" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) => {
        if (collectionId === "general-collection") return [];
        if (collectionId !== "custom-collection") return [];
        return [createPageCollection({ id: "pc-1", collection: "custom-collection", page: "page-1" })];
      }
    );

    await store.ensureCollectionMembershipsHydrated("plane");
    await store.fetchCollectionPages("plane", "custom-collection");

    expect([...store.getCollectionViewPageIds("custom-collection")].sort()).toEqual(["page-1", "page-2", "page-3"]);
    expect([...store.getCollectionRootPageIds("custom-collection")]).toEqual(["page-1"]);
  });

  it("does not keep descendants in the default collection when an ancestor belongs to a custom collection", async () => {
    const pages = {
      "page-1": createWorkspacePage({
        id: "page-1",
        parent_id: null,
        sub_pages_count: 1,
        subPageIds: ["page-2"],
        asJSON: { id: "page-1", parent_id: null, sub_pages_count: 1 },
      }),
      "page-2": createWorkspacePage({
        id: "page-2",
        parent_id: "page-1",
        sub_pages_count: 0,
        subPageIds: [],
        asJSON: { id: "page-2", parent_id: "page-1", sub_pages_count: 0 },
      }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "custom-collection" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) => {
        if (collectionId === "custom-collection") {
          return [createPageCollection({ id: "pc-1", collection: "custom-collection", page: "page-1" })];
        }

        return [];
      }
    );

    await store.fetchCollectionPages("plane", "general");
    await store.fetchCollectionPages("plane", "custom-collection");

    expect([...store.getCollectionViewPageIds("custom-collection")].sort()).toEqual(["page-1", "page-2"]);
    expect([...store.getCollectionViewPageIds("general")]).toEqual([]);
  });

  it("refreshes loaded collection trees immediately after nested hierarchy changes", async () => {
    const pages: Record<string, ReturnType<typeof createWorkspacePage>> = {
      "page-1": createWorkspacePage({
        id: "page-1",
        parent_id: null,
        sub_pages_count: 1,
        subPageIds: [],
        asJSON: { id: "page-1", parent_id: null, sub_pages_count: 1 },
      }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "custom-collection" })]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) => {
        if (collectionId !== "custom-collection") return [];
        return [createPageCollection({ id: "pc-1", collection: "custom-collection", page: "page-1" })];
      }
    );

    await store.fetchCollectionPages("plane", "custom-collection");

    pages["page-2"] = createWorkspacePage({
      id: "page-2",
      parent_id: "page-1",
      sub_pages_count: 0,
      subPageIds: [],
      asJSON: { id: "page-2", parent_id: "page-1", sub_pages_count: 0 },
    });
    pages["page-1"] = {
      ...pages["page-1"],
      subPageIds: ["page-2"],
      asJSON: { id: "page-1", parent_id: null, sub_pages_count: 1 },
    };

    expect([...store.getCollectionViewPageIds("custom-collection")].sort()).toEqual(["page-1", "page-2"]);
  });

  it("optimistically moves an implicitly-general page to a custom collection", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "custom-collection" }),
    ]);

    const membershipsByCollection: Record<string, TPageCollection[]> = {
      "general-collection": [],
      "custom-collection": [],
    };
    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) =>
        membershipsByCollection[collectionId] ?? []
    );
    await store.fetchCollectionPages("plane", "general");

    const destroySpy = vi.spyOn(PageCollectionService.prototype, "destroy").mockResolvedValue(undefined);
    const createSpy = vi.spyOn(PageCollectionService.prototype, "create").mockImplementation(async () => {
      const pageCollection = createPageCollection({ id: "pc-target", collection: "custom-collection", page: "page-1" });
      membershipsByCollection["custom-collection"] = [pageCollection];
      return [pageCollection];
    });

    await store.addPageToCollection("plane", "page-1", "custom-collection");

    expect(destroySpy).not.toHaveBeenCalled();
    expect(createSpy).toHaveBeenCalledWith("plane", "custom-collection", {
      page_ids: ["page-1"],
    });
    expect(store.getPageCollectionByPageId("page-1")?.collection).toBe("custom-collection");
    expect([...store.getCollectionViewPageIds("general")]).toEqual([]);
    expect([...store.getCollectionViewPageIds("custom-collection")]).toEqual(["page-1"]);
  });

  it("optimistically removes a page from a custom collection back to general", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "custom-collection" }),
    ]);
    const membershipsByCollection: Record<string, TPageCollection[]> = {
      "general-collection": [],
      "custom-collection": [createPageCollection({ id: "pc-source", collection: "custom-collection", page: "page-1" })],
    };
    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) =>
        membershipsByCollection[collectionId] ?? []
    );
    await store.fetchCollectionPages("plane", "custom-collection");

    vi.spyOn(PageCollectionService.prototype, "destroy").mockImplementation(async () => {
      membershipsByCollection["custom-collection"] = [];
    });
    vi.spyOn(PageCollectionService.prototype, "create").mockImplementation(async () => {
      const pageCollection = createPageCollection({
        id: "pc-target",
        collection: "general-collection",
        page: "page-1",
      });
      membershipsByCollection["general-collection"] = [pageCollection];
      return [pageCollection];
    });

    await store.removePageFromCollection("plane", "page-1", "custom-collection");

    expect(store.getPageCollectionByPageId("page-1")?.collection).toBe("general-collection");
    expect([...store.getCollectionViewPageIds("custom-collection")]).toEqual([]);
    expect([...store.getCollectionViewPageIds("general")]).toEqual(["page-1"]);
  });

  it("removes loaded descendants from the source collection immediately when moving a parent across collections", async () => {
    const pages = {
      "page-1": createWorkspacePage({
        id: "page-1",
        parent_id: null,
        sub_pages_count: 1,
        subPageIds: ["page-2"],
        asJSON: { id: "page-1", parent_id: null, sub_pages_count: 1 },
      }),
      "page-2": createWorkspacePage({
        id: "page-2",
        parent_id: "page-1",
        sub_pages_count: 0,
        subPageIds: [],
        asJSON: { id: "page-2", parent_id: "page-1", sub_pages_count: 0 },
      }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "source-collection" }),
      createCollection({ id: "target-collection" }),
    ]);

    const membershipsByCollection: Record<string, TPageCollection[]> = {
      "source-collection": [
        createPageCollection({ id: "pc-source-parent", collection: "source-collection", page: "page-1" }),
        createPageCollection({ id: "pc-source-child", collection: "source-collection", page: "page-2" }),
      ],
      "target-collection": [],
    };

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) =>
        membershipsByCollection[collectionId] ?? []
    );

    await store.fetchCollectionPages("plane", "source-collection");
    await store.fetchCollectionPages("plane", "target-collection");

    vi.spyOn(PageCollectionService.prototype, "create").mockImplementation(async () => {
      const nextMemberships = [
        createPageCollection({ id: "pc-target-parent", collection: "target-collection", page: "page-1" }),
        createPageCollection({ id: "pc-target-child", collection: "target-collection", page: "page-2" }),
      ];
      membershipsByCollection["source-collection"] = [];
      membershipsByCollection["target-collection"] = nextMemberships;
      return nextMemberships;
    });

    await store.movePageAcrossCollections("plane", "page-1", "source-collection", "target-collection");

    expect([...store.getCollectionViewPageIds("source-collection")]).toEqual([]);
    expect([...store.getCollectionViewPageIds("target-collection")].sort()).toEqual(["page-1", "page-2"]);
    expect([...store.getCollectionRootPageIds("target-collection")]).toEqual(["page-1"]);
  });

  it("shows a newly created public page in the default collection once memberships are hydrated", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);
    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue([]);

    await store.fetchCollectionPages("plane", "general");

    expect(store.getPageCollectionByPageId("page-1")).toBeUndefined();
    expect([...store.getCollectionViewPageIds("general")]).toEqual(["page-1"]);
    expect([...store.getCollectionRootPageIds("general")]).toEqual(["page-1"]);
  });

  it("shows a newly added public page in an already-hydrated default collection without reload", async () => {
    const pages: Record<string, ReturnType<typeof createWorkspacePage>> = {};
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);
    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue([]);

    await store.ensureCollectionMembershipsHydrated("plane");

    pages["page-1"] = createWorkspacePage({ id: "page-1", parent_id: null });

    expect(store.hasHydratedCollectionMemberships("plane")).toBe(true);
    expect(store.getPageCollectionByPageId("page-1")).toBeUndefined();
    expect([...store.getCollectionViewPageIds("general")]).toEqual(["page-1"]);
    expect([...store.getCollectionRootPageIds("general")]).toEqual(["page-1"]);
  });

  it("hydrates the default collection without prefetching all workspace pages", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "custom-collection" }),
    ]);

    const membershipsByCollection: Record<string, TPageCollection[]> = {
      "general-collection": [],
      "custom-collection": [],
    };
    const listSpy = vi
      .spyOn(PageCollectionService.prototype, "list")
      .mockImplementation(
        async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) => {
          return membershipsByCollection[collectionId] ?? [];
        }
      );

    await store.ensureCollectionMembershipsHydrated("plane");

    expect(rootStore.workspacePages.fetchAllPages).not.toHaveBeenCalled();
    expect(store.hasHydratedCollectionMemberships("plane")).toBe(true);
    expect(listSpy).toHaveBeenCalledTimes(1);
    expect(listSpy).toHaveBeenCalledWith("plane", "general-collection");
  });

  it("returns cached collection memberships on repeat fetches", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "custom-collection" })]);

    const listSpy = vi
      .spyOn(PageCollectionService.prototype, "list")
      .mockResolvedValue([createPageCollection({ id: "pc-1", collection: "custom-collection", page: "page-1" })]);

    await store.fetchCollectionPages("plane", "custom-collection");
    await store.fetchCollectionPages("plane", "custom-collection");

    expect(listSpy).toHaveBeenCalledTimes(1);
  });

  it("moves multiple pages to a collection in one request", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
      "page-2": createWorkspacePage({ id: "page-2", parent_id: null }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "custom-collection" }),
    ]);
    const membershipsByCollection: Record<string, TPageCollection[]> = {
      "general-collection": [],
      "custom-collection": [],
    };
    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) =>
        membershipsByCollection[collectionId] ?? []
    );

    const createSpy = vi.spyOn(PageCollectionService.prototype, "create").mockImplementation(async () => {
      const nextMemberships = [
        createPageCollection({ id: "pc-target-1", collection: "custom-collection", page: "page-1", sort_order: 10000 }),
        createPageCollection({ id: "pc-target-2", collection: "custom-collection", page: "page-2", sort_order: 20000 }),
      ];
      membershipsByCollection["custom-collection"] = nextMemberships;
      return nextMemberships;
    });

    await store.addPagesToCollection("plane", ["page-1", "page-2"], "custom-collection");

    expect(createSpy).toHaveBeenCalledWith("plane", "custom-collection", {
      page_ids: ["page-1", "page-2"],
    });
    expect([...store.getCollectionViewPageIds("custom-collection")]).toEqual(["page-1", "page-2"]);
    expect([...store.getCollectionViewPageIds("general")]).toEqual([]);
  });

  it("keeps collection list and sidebar expansion state independent", () => {
    const rootStore = createRootStore();
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);
    store.toggleCollectionExpandedRow("general", "page-1");

    expect(store.isCollectionRowExpanded("general", "page-1")).toBe(true);
    expect(store.isCollectionSidebarRowExpanded("general", "page-1")).toBe(false);

    store.toggleCollectionSidebarExpandedRow("general", "page-1");

    expect(store.isCollectionRowExpanded("general", "page-1")).toBe(true);
    expect(store.isCollectionSidebarRowExpanded("general", "page-1")).toBe(true);

    store.toggleCollectionExpandedRow("general", "page-1");

    expect(store.isCollectionRowExpanded("general", "page-1")).toBe(false);
    expect(store.isCollectionSidebarRowExpanded("general", "page-1")).toBe(true);
  });

  it("supports expanding multiple pages in workspace collection without dropping prior expansion state", () => {
    const rootStore = createRootStore();
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "general-collection", is_default: true })]);
    store.toggleCollectionExpandedRow("general", "page-1");
    const firstExpandedRef = store.getCollectionExpandedRowIds("general");

    store.toggleCollectionExpandedRow("general", "page-2");
    const secondExpandedRef = store.getCollectionExpandedRowIds("general");

    expect(firstExpandedRef).not.toBe(secondExpandedRef);
    expect([...secondExpandedRef].sort()).toEqual(["page-1", "page-2"]);
  });

  it("keeps route-driven ancestor reveal logic out of the collection store", async () => {
    const pages = {
      "page-1": createWorkspacePage({
        id: "page-1",
        parent_id: null,
        sub_pages_count: 1,
        subPageIds: ["page-2"],
        parentPageIds: [],
        asJSON: { id: "page-1", parent_id: null, sub_pages_count: 1 },
      }),
      "page-2": createWorkspacePage({
        id: "page-2",
        parent_id: "page-1",
        sub_pages_count: 1,
        subPageIds: ["page-3"],
        parentPageIds: ["page-1"],
        asJSON: { id: "page-2", parent_id: "page-1", sub_pages_count: 1 },
      }),
      "page-3": createWorkspacePage({
        id: "page-3",
        parent_id: "page-2",
        sub_pages_count: 0,
        subPageIds: [],
        parentPageIds: ["page-2", "page-1"],
        asJSON: { id: "page-3", parent_id: "page-2", sub_pages_count: 0 },
      }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "custom-collection" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) => {
        if (collectionId === "custom-collection") {
          return [createPageCollection({ id: "pc-1", collection: "custom-collection", page: "page-1" })];
        }

        return [];
      }
    );

    await store.ensureCollectionMembershipsHydrated("plane");

    expect(store.isCollectionExpanded("custom-collection")).toBe(false);
    expect([...store.getCollectionSidebarExpandedRowIds("custom-collection")]).toEqual([]);
    expect([...store.getCollectionExpandedRowIds("custom-collection")]).toEqual([]);
  });

  it("drops explicit memberships from the store when a page leaves workspace collections", async () => {
    const pages = {
      "page-1": createWorkspacePage({
        id: "page-1",
        parent_id: null,
        sub_pages_count: 1,
        subPageIds: ["page-2"],
        asJSON: { id: "page-1", parent_id: null, sub_pages_count: 1 },
      }),
      "page-2": createWorkspacePage({
        id: "page-2",
        parent_id: "page-1",
        sub_pages_count: 0,
        subPageIds: [],
        asJSON: { id: "page-2", parent_id: "page-1", sub_pages_count: 0 },
      }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "custom-collection" }),
    ]);

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) => {
        if (collectionId === "custom-collection") {
          return [createPageCollection({ id: "pc-1", collection: "custom-collection", page: "page-1" })];
        }

        return [];
      }
    );

    await store.fetchCollectionPages("plane", "general");
    await store.fetchCollectionPages("plane", "custom-collection");

    store.removeExplicitPageCollectionsFromStore(["page-1"]);

    expect(store.getPageCollectionByPageId("page-1")).toBeUndefined();
    expect([...store.getCollectionViewPageIds("custom-collection")]).toEqual([]);
    expect([...store.getCollectionViewPageIds("general")].sort()).toEqual(["page-1", "page-2"]);
  });

  it("restores source and target state when the optimistic move fails", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
      "page-2": createWorkspacePage({ id: "page-2", parent_id: null }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "general-collection", is_default: true }),
      createCollection({ id: "custom-collection" }),
    ]);
    const membershipsByCollection: Record<string, TPageCollection[]> = {
      "general-collection": [
        createPageCollection({ id: "pc-source", collection: "general-collection", page: "page-1" }),
      ],
      "custom-collection": [createPageCollection({ id: "pc-target", collection: "custom-collection", page: "page-2" })],
    };
    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) =>
        membershipsByCollection[collectionId] ?? []
    );
    await store.fetchCollectionPages("plane", "general-collection");
    await store.fetchCollectionPages("plane", "custom-collection");

    vi.spyOn(PageCollectionService.prototype, "destroy").mockImplementation(async () => {
      membershipsByCollection["general-collection"] = [];
    });
    vi.spyOn(PageCollectionService.prototype, "create")
      .mockRejectedValueOnce(new Error("boom"))
      .mockImplementationOnce(async () => {
        const restored = createPageCollection({
          id: "pc-source-restored",
          collection: "general-collection",
          page: "page-1",
        });
        membershipsByCollection["general-collection"] = [restored];
        return [restored];
      });

    await expect(store.addPageToCollection("plane", "page-1", "custom-collection")).rejects.toThrow("boom");

    expect(store.getPageCollectionByPageId("page-1")?.collection).toBe("general-collection");
    expect([...store.getCollectionViewPageIds("general-collection")]).toEqual(["page-1"]);
    expect([...store.getCollectionViewPageIds("custom-collection")]).toEqual(["page-2"]);
  });

  it("inserts created collections into the store", async () => {
    const rootStore = createRootStore();
    const store = new CollectionStore(rootStore);
    const collection = createCollection({ id: "collection-created", name: "Created" });

    vi.spyOn(CollectionService.prototype, "create").mockResolvedValue(collection);

    const response = await store.createCollection("plane", {
      name: "Created",
      access: ECollectionAccess.PUBLIC,
      logo_props: {},
    });

    expect(response.id).toBe("collection-created");
    expect(store.getCollectionById("collection-created")?.name).toBe("Created");
  });

  it("rolls back optimistic collection updates on failure", async () => {
    const rootStore = createRootStore();
    const store = new CollectionStore(rootStore);
    const collection = createCollection({ name: "Original" });

    store.updateCollectionsInStore([collection]);
    vi.spyOn(CollectionService.prototype, "update").mockRejectedValue(new Error("boom"));

    const collectionInstance = store.getCollectionById(collection.id);
    await expect(collectionInstance?.updateCollection({ name: "Updated" })).rejects.toThrow("boom");
    expect(collectionInstance?.name).toBe("Original");
  });

  it("removes deleted collections from the store", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);
    const collection = createCollection();
    const defaultCollection = createCollection({ id: "general-collection", is_default: true });
    const membershipsByCollection: Record<string, TPageCollection[]> = {
      "general-collection": [],
      [collection.id]: [createPageCollection({ id: "pc-source", collection: collection.id, page: "page-1" })],
    };

    store.updateCollectionsInStore([defaultCollection, collection]);
    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) =>
        membershipsByCollection[collectionId] ?? []
    );
    await store.fetchCollectionPages("plane", collection.id);
    await store.fetchCollectionPages("plane", "general");
    vi.spyOn(CollectionService.prototype, "destroy").mockResolvedValue();

    await store.deleteCollection("plane", collection.id);

    expect(store.getCollectionById(collection.id)).toBeUndefined();
    expect(store.getPageCollectionByPageId("page-1")).toBeUndefined();
    expect([...store.getCollectionViewPageIds("general")]).toEqual(["page-1"]);
  });

  it("moves collection pages after filtered root lookups without hitting computedFn arity errors", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null }),
      "page-2": createWorkspacePage({ id: "page-2", parent_id: "page-1" }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "source-collection" }),
      createCollection({ id: "target-collection" }),
    ]);

    const membershipsByCollection: Record<string, TPageCollection[]> = {
      "source-collection": [
        createPageCollection({ id: "pc-source-parent", collection: "source-collection", page: "page-1" }),
        createPageCollection({ id: "pc-source-child", collection: "source-collection", page: "page-2" }),
      ],
      "target-collection": [],
    };

    vi.spyOn(PageCollectionService.prototype, "list").mockImplementation(
      async (_workspaceSlug: PageCollectionListArgs[0], collectionId: PageCollectionListArgs[1]) =>
        membershipsByCollection[collectionId] ?? []
    );

    await store.fetchCollectionPages("plane", "source-collection");
    await store.fetchCollectionPages("plane", "target-collection");

    expect(store.getCollectionRootPageIds("target-collection", {})).toEqual([]);

    vi.spyOn(CollectionService.prototype, "movePages").mockImplementation(async () => {
      membershipsByCollection["source-collection"] = [];
      membershipsByCollection["target-collection"] = [
        createPageCollection({ id: "pc-target-parent", collection: "target-collection", page: "page-1" }),
        createPageCollection({ id: "pc-target-child", collection: "target-collection", page: "page-2" }),
      ];
    });

    await expect(store.moveCollectionPages("plane", "source-collection", "target-collection")).resolves.toBeUndefined();

    expect(store.getCollectionById("source-collection")).toBeUndefined();
    expect([...store.getCollectionViewPageIds("target-collection")].sort()).toEqual(["page-1", "page-2"]);
    expect(store.getCollectionRootPageIds("target-collection", {})).toEqual(["page-1"]);
  });

  it("limits addable pages to owned pages for members and all eligible pages for workspace admins", () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", isCurrentUserOwner: true, access: EPageAccess.PUBLIC }),
      "page-2": createWorkspacePage({ id: "page-2", isCurrentUserOwner: false, access: EPageAccess.PUBLIC }),
      "page-3": createWorkspacePage({ id: "page-3", isCurrentUserOwner: true, access: EPageAccess.PRIVATE }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "custom-collection" })]);

    rootStore.user.permission.allowPermissions = vi.fn(() => false);
    expect(store.getAddablePageIdsForCollection("custom-collection")).toEqual(["page-1"]);

    rootStore.user.permission.allowPermissions = vi.fn(() => true);
    expect(store.getAddablePageIdsForCollection("custom-collection")).toEqual(["page-1", "page-2"]);
  });

  it("allows remove-from-collection for workspace admin and page owner only", () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", isCurrentUserOwner: false }),
      "page-2": createWorkspacePage({ id: "page-2", isCurrentUserOwner: true }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([
      createCollection({ id: "owner-collection", owned_by_id: "user-1" }),
      createCollection({ id: "other-collection", owned_by_id: "user-2" }),
    ]);

    rootStore.user.permission.allowPermissions = vi.fn(() => false);
    expect(store.canCurrentUserRemovePageFromCollection("other-collection", "page-2")).toBe(true);
    expect(store.canCurrentUserRemovePageFromCollection("other-collection", "page-1")).toBe(false);
    expect(store.canCurrentUserRemovePageFromCollection("owner-collection", "page-1")).toBe(false);

    rootStore.user.permission.allowPermissions = vi.fn(() => true);
    expect(store.canCurrentUserRemovePageFromCollection("other-collection", "page-1")).toBe(true);
  });

  it("computes destination sort order for before, middle, and after positions", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null, sort_order: 10000 }),
      "page-2": createWorkspacePage({ id: "page-2", parent_id: null, sort_order: 20000 }),
      "page-3": createWorkspacePage({ id: "page-3", parent_id: null, sort_order: 30000 }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "custom-collection" })]);
    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue([
      createPageCollection({ id: "pc-1", collection: "custom-collection", page: "page-1", sort_order: 10000 }),
      createPageCollection({ id: "pc-2", collection: "custom-collection", page: "page-2", sort_order: 20000 }),
      createPageCollection({ id: "pc-3", collection: "custom-collection", page: "page-3", sort_order: 30000 }),
    ]);

    await store.fetchCollectionPages("plane", "custom-collection");

    expect(store.computeDestinationSortOrder("custom-collection", "page-1", "before", "page-3")).toBe(0);
    expect(store.computeDestinationSortOrder("custom-collection", "page-2", "before", "page-3")).toBe(15000);
    expect(store.computeDestinationSortOrder("custom-collection", "page-3", "after", "page-1")).toBe(40000);
  });

  it("reorders a page within a collection using page collection sort order", async () => {
    const pages = {
      "page-1": createWorkspacePage({ id: "page-1", parent_id: null, sort_order: 10000 }),
      "page-2": createWorkspacePage({ id: "page-2", parent_id: null, sort_order: 20000 }),
      "page-3": createWorkspacePage({ id: "page-3", parent_id: null, sort_order: 30000 }),
    };
    const rootStore = createRootStore(pages);
    const store = new CollectionStore(rootStore);

    store.updateCollectionsInStore([createCollection({ id: "custom-collection" })]);
    vi.spyOn(PageCollectionService.prototype, "list").mockResolvedValue([
      createPageCollection({ id: "pc-1", collection: "custom-collection", page: "page-1", sort_order: 10000 }),
      createPageCollection({ id: "pc-2", collection: "custom-collection", page: "page-2", sort_order: 20000 }),
      createPageCollection({ id: "pc-3", collection: "custom-collection", page: "page-3", sort_order: 30000 }),
    ]);
    await store.fetchCollectionPages("plane", "custom-collection");

    const updateSpy = vi
      .spyOn(PageCollectionService.prototype, "update")
      .mockImplementation(async (_workspaceSlug, collectionId, pageCollectionId, payload) =>
        createPageCollection({
          id: pageCollectionId,
          collection: collectionId,
          page: "page-3",
          sort_order: payload.sort_order,
        })
      );

    await store.movePageWithinCollection("plane", "page-3", "custom-collection", "page-1", "before");

    expect(updateSpy).toHaveBeenCalledWith("plane", "custom-collection", "pc-3", { sort_order: 0 });
    expect(store.getPageCollectionByPageId("page-3")?.sort_order).toBe(0);
  });
});
