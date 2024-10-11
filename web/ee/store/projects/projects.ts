/* eslint-disable no-useless-catch */

import { action, computed, makeObservable } from "mobx";

// store
import { ProjectStore as CeProjectStore, IProjectStore as ICeProjectStore } from "@/store/project/project.store";
import { CoreRootStore } from "@/store/root.store";

export interface IProjectStore extends ICeProjectStore {
  //computed
  publicProjectIds: string[];
  privateProjectIds: string[];
  myProjectIds: string[];
  // actions
  filteredProjectCount: (filter: string) => number | undefined;
}

export class ProjectStore extends CeProjectStore implements IProjectStore {
  constructor(public store: CoreRootStore) {
    super(store);
    makeObservable(this, {
      // computed
      publicProjectIds: computed,
      privateProjectIds: computed,
      myProjectIds: computed,
      // actions
      filteredProjectCount: action,
    });
  }

  // computed
  /**
   * Returns public project IDs belong to current workspace.
   */
  get publicProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];

    const projects = Object.values(this.projectMap ?? {});

    const projectIds = projects
      .filter((project) => project.workspace === currentWorkspace.id && project.network === 2)
      .map((project) => project.id);
    return projectIds;
  }

  /**
   * Returns private project IDs belong to current workspace.
   */
  get myProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];

    const projects = Object.values(this.projectMap ?? {});

    const projectIds = projects
      .filter((project) => project.workspace === currentWorkspace.id && project.is_member)
      .map((project) => project.id);
    return projectIds;
  }

  /**
   * Returns private project IDs belong to current workspace.
   */
  get privateProjectIds() {
    const currentWorkspace = this.rootStore.workspaceRoot.currentWorkspace;
    if (!currentWorkspace) return [];

    const projects = Object.values(this.projectMap ?? {});

    const projectIds = projects
      .filter((project) => project.workspace === currentWorkspace.id && project.network === 0)
      .map((project) => project.id);
    return projectIds;
  }
  /**
   * Returns private project IDs belong to current workspace.
   */
  filteredProjectCount = (filter: string) => {
    console.log(this, filter);
    switch (filter) {
      case "all_projects":
        return this.totalProjectIds?.length;
      case "public":
        return this.publicProjectIds.length;
      case "private":
        return this.privateProjectIds.length;
      case "my_projects":
        return this.myProjectIds.length;
      default:
        return 0;
    }
  };
}
