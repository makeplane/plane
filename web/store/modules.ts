import { action, computed, observable, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project.service";
import { ModuleService } from "services/modules.service";
// types
import { RootStore } from "./root";
import { IIssue, IModule } from "types";
import { IIssueGroupWithSubGroupsStructure, IIssueGroupedStructure, IIssueUnGroupedStructure } from "./issue";

export interface IModuleStore {
  loader: boolean;
  error: any | null;

  moduleId: string | null;
  modules: {
    [project_id: string]: IModule[];
  };
  moduleDetails: {
    [module_id: string]: IModule;
  };
  issues: {
    [module_id: string]: {
      grouped: IIssueGroupedStructure;
      groupWithSubGroups: IIssueGroupWithSubGroupsStructure;
      ungrouped: IIssueUnGroupedStructure;
    };
  };

  setModuleId: (moduleSlug: string) => void;

  fetchModules: (workspaceSlug: string, projectId: string) => void;
  fetchModuleDetails: (workspaceSlug: string, projectId: string, moduleId: string) => void;

  // crud operations
  createModule: (workspaceSlug: string, projectId: string, data: Partial<IModule>) => Promise<IModule>;
  updateModuleDetails: (workspaceSlug: string, projectId: string, moduleId: string, data: Partial<IModule>) => void;
  deleteModule: (workspaceSlug: string, projectId: string, moduleId: string) => void;
  addModuleToFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => void;
  removeModuleFromFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => void;

  // issue related operations
  fetchModuleIssues: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<any>;
  updateIssueStructure: (group_id: string | null, sub_group_id: string | null, moduleId: string, issue: IIssue) => void;

  // computed
  getIssues: IIssueGroupedStructure | IIssueGroupWithSubGroupsStructure | IIssueUnGroupedStructure | null;
}

class ModuleStore implements IModuleStore {
  loader: boolean = false;
  error: any | null = null;

  moduleId: string | null = null;

  modules: {
    [project_id: string]: IModule[];
  } = {};

  moduleDetails: {
    [module_id: string]: IModule;
  } = {};

  issues: {
    [module_id: string]: {
      grouped: {
        [group_id: string]: IIssue[];
      };
      groupWithSubGroups: {
        [group_id: string]: {
          [sub_group_id: string]: IIssue[];
        };
      };
      ungrouped: IIssue[];
    };
  } = {};

  // root store
  rootStore;
  // services
  projectService;
  moduleService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      loader: observable,
      error: observable.ref,

      moduleId: observable.ref,
      modules: observable.ref,
      moduleDetails: observable.ref,
      issues: observable.ref,

      // computed
      getIssues: computed,

      // actions
      setModuleId: action,

      fetchModules: action,
      fetchModuleDetails: action,

      createModule: action,
      updateModuleDetails: action,
      deleteModule: action,
      addModuleToFavorites: action,
      removeModuleFromFavorites: action,

      fetchModuleIssues: action,
      updateIssueStructure: action,
    });

    this.rootStore = _rootStore;
    this.projectService = new ProjectService();
    this.moduleService = new ModuleService();
  }

  // computed
  get projectModules() {
    if (!this.rootStore.project.projectId) return null;
    return this.modules[this.rootStore.project.projectId] || null;
  }

  get getIssues() {
    const moduleId = this.moduleId;

    const issueType = this.rootStore.issue.getIssueType;

    if (!moduleId || !issueType) return null;

    return this.issues?.[moduleId]?.[issueType] || null;
  }

  // actions
  setModuleId = (moduleSlug: string) => {
    this.moduleId = moduleSlug ?? null;
  };

  fetchModules = async (workspaceSlug: string, projectId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const modulesResponse = await this.moduleService.getModules(workspaceSlug, projectId);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: modulesResponse,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch modules list in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
    }
  };

  fetchModuleDetails = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      runInAction(() => {
        this.loader = true;
        this.error = null;
      });

      const response = await this.moduleService.getModuleDetails(workspaceSlug, projectId, moduleId);

      if (!response) return null;

      runInAction(() => {
        this.moduleDetails = {
          ...this.moduleDetails,
          [moduleId]: response,
        };
        this.loader = false;
        this.error = null;
      });
    } catch (error) {
      console.error("Failed to fetch module details in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });
    }
  };

  createModule = async (workspaceSlug: string, projectId: string, data: Partial<IModule>) => {
    try {
      const response = await this.moduleService.createModule(
        workspaceSlug,
        projectId,
        data,
        this.rootStore.user.currentUser
      );

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: [...this.modules[projectId], response],
        };
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      console.error("Failed to create module in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  updateModuleDetails = async (workspaceSlug: string, projectId: string, moduleId: string, data: Partial<IModule>) => {
    try {
      runInAction(() => {
        (this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) =>
            module.id === moduleId ? { ...module, ...data } : module
          ),
        }),
          (this.moduleDetails = {
            ...this.moduleDetails,
            [moduleId]: {
              ...this.moduleDetails[moduleId],
              ...data,
            },
          });
      });

      await this.moduleService.patchModule(workspaceSlug, projectId, moduleId, data, this.rootStore.user.currentUser);
    } catch (error) {
      console.error("Failed to update module in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });
    }
  };

  deleteModule = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].filter((module) => module.id !== moduleId),
        };
      });

      await this.moduleService.deleteModule(workspaceSlug, projectId, moduleId, this.rootStore.user.currentUser);
    } catch (error) {
      console.error("Failed to delete module in module store", error);

      this.fetchModules(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });
    }
  };

  addModuleToFavorites = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) => ({
            ...module,
            is_favorite: module.id === moduleId ? true : module.is_favorite,
          })),
        };
      });

      await this.moduleService.addModuleToFavorites(workspaceSlug, projectId, {
        module: moduleId,
      });
    } catch (error) {
      console.error("Failed to add module to favorites in module store", error);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) => ({
            ...module,
            is_favorite: module.id === moduleId ? false : module.is_favorite,
          })),
        };
        this.error = error;
      });
    }
  };

  removeModuleFromFavorites = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) => ({
            ...module,
            is_favorite: module.id === moduleId ? false : module.is_favorite,
          })),
        };
      });

      await this.moduleService.removeModuleFromFavorites(workspaceSlug, projectId, moduleId);
    } catch (error) {
      console.error("Failed to remove module from favorites in module store", error);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId].map((module) => ({
            ...module,
            is_favorite: module.id === moduleId ? true : module.is_favorite,
          })),
        };
      });
    }
  };

  fetchModuleIssues = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      this.loader = true;
      this.error = null;

      this.rootStore.workspace.setWorkspaceSlug(workspaceSlug);
      this.rootStore.project.setProjectId(projectId);

      const params = this.rootStore?.issueFilter?.appliedFilters;
      const issueResponse = await this.moduleService.getModuleIssuesWithParams(
        workspaceSlug,
        projectId,
        moduleId,
        params
      );

      const issueType = this.rootStore.issue.getIssueType;
      if (issueType != null) {
        const _issues = {
          ...this.issues,
          [moduleId]: {
            ...this.issues[moduleId],
            [issueType]: issueResponse,
          },
        };
        runInAction(() => {
          this.issues = _issues;
          this.loader = false;
          this.error = null;
        });
      }

      return issueResponse;
    } catch (error) {
      console.error("Error: Fetching error module issues in module store", error);
      this.loader = false;
      this.error = error;
      return error;
    }
  };

  updateIssueStructure = async (
    group_id: string | null,
    sub_group_id: string | null,
    moduleId: string,
    issue: IIssue
  ) => {
    const issueType = this.rootStore.issue.getIssueType;

    if (!issueType) return null;

    let issues = this.getIssues;

    if (!issues) return null;

    if (issueType === "grouped" && group_id) {
      issues = issues as IIssueGroupedStructure;
      issues = {
        ...issues,
        [group_id]: issues[group_id].map((i: IIssue) => (i?.id === issue?.id ? issue : i)),
      };
    }
    if (issueType === "groupWithSubGroups" && group_id && sub_group_id) {
      issues = issues as IIssueGroupWithSubGroupsStructure;
      issues = {
        ...issues,
        [sub_group_id]: {
          ...issues[sub_group_id],
          [group_id]: issues[sub_group_id][group_id].map((i: IIssue) => (i?.id === issue?.id ? issue : i)),
        },
      };
    }
    if (issueType === "ungrouped") {
      issues = issues as IIssueUnGroupedStructure;
      issues = issues.map((i: IIssue) => (i?.id === issue?.id ? issue : i));
    }

    runInAction(() => {
      this.issues = { ...this.issues, [moduleId]: { ...this.issues[moduleId], [issueType]: issues } };
    });
  };
}

export default ModuleStore;
