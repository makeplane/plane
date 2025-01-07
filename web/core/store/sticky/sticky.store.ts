import { observable, action, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
import { TSticky } from "@plane/types";
import { StickyService } from "@/services/sticky.service";
export interface IStickyStore {
  creatingSticky: boolean;
  fetchingWorkspaceStickies: boolean;
  workspaceStickies: Record<string, string[]>; // workspaceId -> stickyIds
  stickies: Record<string, TSticky>; // stickyId -> sticky
  searchQuery: string;
  activeStickyId: string | undefined;
  recentStickyId: string | undefined;
  showAddNewSticky: boolean;
  currentPage: number;
  totalPages: number;

  // computed
  getWorkspaceStickies: (workspaceSlug: string) => string[];

  // actions
  toggleShowNewSticky: (value: boolean) => void;
  updateSearchQuery: (query: string) => void;
  fetchWorkspaceStickies: (workspaceSlug: string, cursor?: string, per_page?: number) => void;
  createSticky: (workspaceSlug: string, sticky: Partial<TSticky>) => void;
  updateSticky: (workspaceSlug: string, id: string, updates: Partial<TSticky>) => void;
  deleteSticky: (workspaceSlug: string, id: string) => void;
  updateActiveStickyId: (id: string | undefined) => void;
  fetchRecentSticky: (workspaceSlug: string) => void;
  incrementPage: () => void;
}

export class StickyStore implements IStickyStore {
  creatingSticky = false;
  fetchingWorkspaceStickies = true;
  workspaceStickies: Record<string, string[]> = {};
  stickies: Record<string, TSticky> = {};
  recentStickyId: string | undefined = undefined;
  searchQuery = "";
  activeStickyId: string | undefined = undefined;
  showAddNewSticky = false;
  currentPage = 0;
  totalPages = 0;

  // services
  stickyService;

  constructor() {
    makeObservable(this, {
      // observables
      creatingSticky: observable,
      fetchingWorkspaceStickies: observable,
      activeStickyId: observable,
      showAddNewSticky: observable,
      recentStickyId: observable,
      workspaceStickies: observable,
      stickies: observable,
      searchQuery: observable,
      currentPage: observable,
      totalPages: observable,
      // actions
      updateSearchQuery: action,
      updateSticky: action,
      deleteSticky: action,
      incrementPage: action,
    });
    this.stickyService = new StickyService();
  }

  getWorkspaceStickies = computedFn((workspaceSlug: string) => {
    let filteredStickies = (this.workspaceStickies[workspaceSlug] || []).map((stickyId) => this.stickies[stickyId]);
    if (this.searchQuery) {
      filteredStickies = filteredStickies.filter(
        (sticky) => sticky.name && sticky.name.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
    }
    return filteredStickies.map((sticky) => sticky.id);
  });

  toggleShowNewSticky = (value: boolean) => {
    this.showAddNewSticky = value;
  };

  updateSearchQuery = (query: string) => {
    this.searchQuery = query;
  };

  updateActiveStickyId = (id: string | undefined) => {
    this.activeStickyId = id;
  };

  incrementPage = () => {
    this.currentPage += 1;
  };

  fetchRecentSticky = async (workspaceSlug: string) => {
    const response = await this.stickyService.getStickies(workspaceSlug, "1:0:0", 1);
    runInAction(() => {
      this.recentStickyId = response.results[0]?.id;
      this.stickies[response.results[0]?.id] = response.results[0];
    });
  };
  fetchWorkspaceStickies = async (workspaceSlug: string, cursor?: string, per_page?: number) => {
    try {
      const response = await this.stickyService.getStickies(workspaceSlug, cursor, per_page);

      runInAction(() => {
        response.results.forEach((sticky) => {
          if (!this.workspaceStickies[workspaceSlug]?.includes(sticky.id)) {
            this.workspaceStickies[workspaceSlug] = [...(this.workspaceStickies[workspaceSlug] || []), sticky.id];
          }
          this.stickies[sticky.id] = sticky;
        });
        this.totalPages = response.total_pages;
        this.fetchingWorkspaceStickies = false;
      });
    } catch (e) {
      console.error(e);
      this.fetchingWorkspaceStickies = false;
    }
  };

  createSticky = async (workspaceSlug: string, sticky: Partial<TSticky>) => {
    if (!this.showAddNewSticky) return;
    this.showAddNewSticky = false;
    this.creatingSticky = true;
    const workspaceStickies = this.workspaceStickies[workspaceSlug] || [];
    const response = await this.stickyService.createSticky(workspaceSlug, sticky);
    runInAction(() => {
      this.stickies[response.id] = response;
      this.workspaceStickies[workspaceSlug] = [response.id, ...workspaceStickies];
      this.activeStickyId = response.id;
      this.recentStickyId = response.id;
      this.creatingSticky = false;
    });
  };

  updateSticky = async (workspaceSlug: string, id: string, updates: Partial<TSticky>) => {
    const sticky = this.stickies[id];
    if (!sticky) return;
    try {
      this.stickies[id] = {
        ...sticky,
        ...updates,
        updatedAt: new Date(),
      };
      this.recentStickyId = id;
      await this.stickyService.updateSticky(workspaceSlug, id, updates);
    } catch (e) {
      console.log(e);
      this.stickies[id] = sticky;
    }
  };

  deleteSticky = async (workspaceSlug: string, id: string) => {
    const sticky = this.stickies[id];
    if (!sticky) return;
    try {
      this.workspaceStickies[workspaceSlug] = this.workspaceStickies[workspaceSlug].filter(
        (stickyId) => stickyId !== id
      );
      if (this.activeStickyId === id) this.activeStickyId = undefined;
      delete this.stickies[id];
      this.recentStickyId = this.workspaceStickies[workspaceSlug][0];
      await this.stickyService.deleteSticky(workspaceSlug, id);
    } catch (e) {
      console.log(e);
      this.stickies[id] = sticky;
    }
  };
}
