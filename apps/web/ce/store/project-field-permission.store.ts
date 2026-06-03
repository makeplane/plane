import { action, makeObservable, observable, ObservableMap, runInAction } from "mobx";
import type { IProjectFieldPermission, EProjectFieldPermissionKey } from "@plane/types";
import { PROJECT_FIELD_PERMISSION_BACKEND_KEY } from "@plane/types";
import { ProjectFieldPermissionService } from "../services/project-field-permission.service";

export interface IProjectFieldPermissionStore {
  // observables
  permissionsMap: ObservableMap<string, IProjectFieldPermission>;
  // computed-fn
  canMemberAction: (workspaceSlug: string, projectId: string, key: EProjectFieldPermissionKey) => boolean;
  // actions
  fetchPermissions: (workspaceSlug: string, projectId: string) => Promise<void>;
  updatePermissions: (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IProjectFieldPermission>
  ) => Promise<IProjectFieldPermission>;
}

export class ProjectFieldPermissionStore implements IProjectFieldPermissionStore {
  // observables
  permissionsMap: ObservableMap<string, IProjectFieldPermission> = new ObservableMap();

  // service
  private service: ProjectFieldPermissionService;

  constructor() {
    this.service = new ProjectFieldPermissionService();

    makeObservable(this, {
      permissionsMap: observable,
      fetchPermissions: action,
      updatePermissions: action,
    });
  }

  /** Composite key used to scope permissions per workspace+project pair. */
  private cacheKey(workspaceSlug: string, projectId: string): string {
    return `${workspaceSlug}:${projectId}`;
  }

  /**
   * Returns whether a member is allowed to perform the given field action
   * for the specified project. Falls back to false when data is not loaded.
   */
  canMemberAction = (workspaceSlug: string, projectId: string, key: EProjectFieldPermissionKey): boolean => {
    const row = this.permissionsMap.get(this.cacheKey(workspaceSlug, projectId));
    if (!row) return false;
    const backendKey = PROJECT_FIELD_PERMISSION_BACKEND_KEY[key];
    return row[backendKey] ?? false;
  };

  /** Fetch and cache field permissions for a project. */
  fetchPermissions = async (workspaceSlug: string, projectId: string): Promise<void> => {
    const data = await this.service.fetch(workspaceSlug, projectId);
    runInAction(() => {
      this.permissionsMap.set(this.cacheKey(workspaceSlug, projectId), data);
    });
  };

  /** Optimistically update permissions and persist to backend. */
  updatePermissions = async (
    workspaceSlug: string,
    projectId: string,
    payload: Partial<IProjectFieldPermission>
  ): Promise<IProjectFieldPermission> => {
    const key = this.cacheKey(workspaceSlug, projectId);
    const original = this.permissionsMap.get(key);

    // Optimistic update
    if (original) {
      runInAction(() => {
        this.permissionsMap.set(key, { ...original, ...payload });
      });
    }

    try {
      const updated = await this.service.update(workspaceSlug, projectId, payload);
      runInAction(() => {
        this.permissionsMap.set(key, updated);
      });
      return updated;
    } catch (error) {
      // Rollback on failure
      if (original) {
        runInAction(() => {
          this.permissionsMap.set(key, original);
        });
      }
      throw error;
    }
  };
}
