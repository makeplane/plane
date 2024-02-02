// services

import {
  WorkspaceViewService,
  WorkspaceMeViewService,
  ProjectViewService,
  ProjectViewMeService,
  WorkspaceFiltersService,
  ProjectFiltersService,
  ModuleFiltersService,
  CycleFiltersService,
  // LocalStorageFiltersService,
} from "services/view";
// stores
import { ViewRootStore } from "./view-root.store";
import { userViewRootStore } from "./user/view-root.store";
// types
import { RootStore } from "store/root.store";

export class GlobalViewRootStore {
  // views root
  workspaceViewMeStore: ViewRootStore;
  workspaceViewStore: ViewRootStore;
  workspaceViewProjectStore: ViewRootStore;
  projectViewStore: ViewRootStore;
  projectViewMeStore: ViewRootStore;

  // user views root
  workspaceUserViewStore?: userViewRootStore;
  projectUserViewStore?: userViewRootStore;
  moduleUserViewStore?: userViewRootStore;
  cycleUserViewStore?: userViewRootStore;

  constructor(private store: RootStore) {
    // views root
    this.workspaceViewMeStore = new ViewRootStore(this.store, new WorkspaceMeViewService());
    this.workspaceViewStore = new ViewRootStore(this.store, new WorkspaceViewService());
    this.workspaceViewProjectStore = new ViewRootStore(this.store, new WorkspaceMeViewService());
    this.projectViewStore = new ViewRootStore(this.store, new ProjectViewService());
    this.projectViewMeStore = new ViewRootStore(this.store, new ProjectViewMeService());

    // user views root
    this.workspaceUserViewStore = new userViewRootStore(
      new WorkspaceFiltersService(),
      store.app?.router?.workspaceSlug,
      undefined,
      undefined
    );
    this.projectUserViewStore = new userViewRootStore(
      new ProjectFiltersService(),
      store.app?.router?.workspaceSlug,
      store.app?.router?.projectId,
      undefined
    );
    this.moduleUserViewStore = new userViewRootStore(
      new ModuleFiltersService(),
      store.app?.router?.workspaceSlug,
      store.app?.router?.projectId,
      store.app?.router?.moduleId
    );
    this.cycleUserViewStore = new userViewRootStore(
      new CycleFiltersService(),
      store.app?.router?.workspaceSlug,
      store.app?.router?.projectId,
      store.app?.router?.cycleId
    );
    // this.archivedUserViewStore = new userViewRootStore( new LocalStorageFiltersService());
    // this.draftUserViewStore = new userViewRootStore( new LocalStorageFiltersService());
  }
}
