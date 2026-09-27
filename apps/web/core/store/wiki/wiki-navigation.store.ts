/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { makeObservable, observable, runInAction } from "mobx";
// types
import type { TPage, TPageCollection, TPageCollectionPage, TWikiNavigationScopeState } from "@plane/types";
// services
import { WorkspacePageCollectionService, WorkspacePageService } from "@/services/page";

/**
 * Narrow service contracts the navigation store depends on. The real
 * workspace page and collection services satisfy them structurally, so tests
 * can inject plain-object fakes instead.
 */
export type TWikiNavigationServices = {
  pageService: {
    fetchAll: (workspaceSlug: string) => Promise<TPage[]>;
  };
  collectionService: {
    fetchAll: (workspaceSlug: string) => Promise<TPageCollection[]>;
    fetchPages: (workspaceSlug: string, collectionId: string) => Promise<TPageCollectionPage[]>;
  };
};

export interface IWikiNavigationStore {
  scopes: Record<string, TWikiNavigationScopeState>;
  getScope: (workspaceSlug: string) => TWikiNavigationScopeState;
  fetchScope: (workspaceSlug: string) => Promise<TWikiNavigationScopeState>;
  invalidateScope: (workspaceSlug: string, affectedCollectionIds?: string[]) => Promise<TWikiNavigationScopeState | undefined>;
  fetchCollectionPages: (workspaceSlug: string, collectionId: string) => Promise<TPageCollectionPage[]>;
}

const createEmptyScope = (): TWikiNavigationScopeState => ({
  pagesById: {},
  pageIds: [],
  collectionsById: {},
  collectionIds: [],
  collectionPagesById: {},
  status: "idle",
  error: null,
});

/**
 * Wiki navigation state partitioned per workspace scope: each scope keeps its
 * own page and collection tree, so loading one workspace can never clobber
 * or leak into another.
 */
export class WikiNavigationStore implements IWikiNavigationStore {
  scopes: Record<string, TWikiNavigationScopeState> = {};
  services: TWikiNavigationServices;
  // in-flight scope loads, deduped by workspace slug (not observable)
  private inFlight = new Map<string, Promise<TWikiNavigationScopeState>>();

  constructor(services?: TWikiNavigationServices) {
    makeObservable(this, { scopes: observable });
    this.services = {
      pageService: services?.pageService ?? new WorkspacePageService(),
      collectionService: services?.collectionService ?? new WorkspacePageCollectionService(),
    };
  }

  getScope = (workspaceSlug: string): TWikiNavigationScopeState => this.scopes[workspaceSlug] ?? createEmptyScope();

  /**
   * Load the page and collection lists for one workspace scope. Concurrent
   * calls for the same scope share one request; a scope that already renders a
   * snapshot refreshes silently (the old tree stays visible until the fresh
   * data lands) so revisiting a scope can never show a stale list.
   */
  fetchScope = (workspaceSlug: string): Promise<TWikiNavigationScopeState> => {
    const inFlight = this.inFlight.get(workspaceSlug);
    if (inFlight) return inFlight;
    const request = this.loadScope(workspaceSlug).finally(() => this.inFlight.delete(workspaceSlug));
    this.inFlight.set(workspaceSlug, request);
    return request;
  };

  /**
   * Refresh a scope after a Wiki page mutation (create, rename, move, archive,
   * restore, delete). A scope that was never loaded has no stale UI to fix, so
   * it is left untouched.
   */
  invalidateScope = async (
    workspaceSlug: string,
    affectedCollectionIds: string[] = []
  ): Promise<TWikiNavigationScopeState | undefined> => {
    const currentScope = this.scopes[workspaceSlug];
    if (!currentScope) return undefined;

    // Keep track of Collection trees already materialized in the sidebar.
    // A page move/add/remove changes Collection membership without changing
    // the page or Collection list, so refreshing only fetchScope() would leave
    // collectionPagesById stale and the sidebar would keep rendering the old
    // membership until a full reload.
    const loadedCollectionIds = [...new Set([...Object.keys(currentScope.collectionPagesById), ...affectedCollectionIds])];

    // Wait out an in-flight load so a stale response cannot land after the
    // mutation that invalidated this scope.
    await this.inFlight.get(workspaceSlug)?.catch(() => undefined);
    const refreshedScope = await this.fetchScope(workspaceSlug);

    const collectionIdsToRefresh = loadedCollectionIds.filter((collectionId) =>
      refreshedScope.collectionIds.includes(collectionId)
    );
    if (collectionIdsToRefresh.length > 0) {
      await Promise.all(
        collectionIdsToRefresh.map((collectionId) => this.fetchCollectionPages(workspaceSlug, collectionId))
      );
    }

    return this.getScope(workspaceSlug);
  };

  private loadScope = async (workspaceSlug: string): Promise<TWikiNavigationScopeState> => {
    const cached = this.scopes[workspaceSlug];
    // only an empty or failed scope shows the loading state; a loaded scope
    // keeps its snapshot while the refresh runs
    if (!cached || cached.status !== "loaded") {
      runInAction(() => {
        const scope = this.scopes[workspaceSlug] ?? createEmptyScope();
        this.scopes[workspaceSlug] = { ...scope, status: "loading", error: null };
      });
    }

    try {
      const [pages, collections] = await Promise.all([
        this.services.pageService.fetchAll(workspaceSlug),
        this.services.collectionService.fetchAll(workspaceSlug),
      ]);
      return runInAction(() => {
        const scope = this.scopes[workspaceSlug] ?? createEmptyScope();
        const pagesById: Record<string, TPage> = {};
        const pageIds: string[] = [];
        for (const page of pages) {
          if (page?.id) {
            pagesById[page.id] = page;
            pageIds.push(page.id);
          }
        }
        const collectionsById: Record<string, TPageCollection> = {};
        const collectionIds: string[] = [];
        for (const collection of collections) {
          collectionsById[collection.id] = collection;
          collectionIds.push(collection.id);
        }
        const loaded: TWikiNavigationScopeState = {
          ...scope,
          pagesById,
          pageIds,
          collectionsById,
          collectionIds,
          status: "loaded",
          error: null,
        };
        this.scopes[workspaceSlug] = loaded;
        return loaded;
      });
    } catch (error) {
      runInAction(() => {
        const scope = this.scopes[workspaceSlug] ?? createEmptyScope();
        this.scopes[workspaceSlug] = {
          ...scope,
          status: "error",
          error: error instanceof Error ? error.message : "Failed to load the Wiki navigation",
        };
      });
      throw error;
    }
  };

  /**
   * Load the pages of one collection, updating only
   * `scopes[workspaceSlug].collectionPagesById[collectionId]`.
   */
  fetchCollectionPages = async (workspaceSlug: string, collectionId: string): Promise<TPageCollectionPage[]> => {
    const pages = await this.services.collectionService.fetchPages(workspaceSlug, collectionId);
    runInAction(() => {
      const scope = this.scopes[workspaceSlug] ?? createEmptyScope();
      this.scopes[workspaceSlug] = {
        ...scope,
        collectionPagesById: { ...scope.collectionPagesById, [collectionId]: pages },
      };
    });
    return pages;
  };
}
