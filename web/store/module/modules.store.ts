import { action, computed, observable, makeObservable, runInAction } from "mobx";
// services
import { ProjectService } from "services/project";
import { ModuleService } from "services/module.service";
// types
import { RootStore } from "../root";
import { IIssue, IModule, ILinkDetails } from "types";
import {
  IIssueGroupWithSubGroupsStructure,
  IIssueGroupedStructure,
  IIssueUnGroupedStructure,
} from "../issue/issue.store";
import { IBlockUpdateData } from "components/gantt-chart";

export interface IModuleStore {
  // states
  loader: boolean;
  error: any | null;

  // observables
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

  // actions
  setModuleId: (moduleId: string | null) => void;

  getModuleById: (moduleId: string) => IModule | null;

  fetchModules: (workspaceSlug: string, projectId: string) => void;
  fetchModuleDetails: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<IModule>;

  createModule: (workspaceSlug: string, projectId: string, data: Partial<IModule>) => Promise<IModule>;
  updateModuleDetails: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<IModule>
  ) => Promise<IModule>;
  deleteModule: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;

  createModuleLink: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<ILinkDetails>
  ) => Promise<ILinkDetails>;
  updateModuleLink: (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    linkId: string,
    data: Partial<ILinkDetails>
  ) => Promise<ILinkDetails>;
  deleteModuleLink: (workspaceSlug: string, projectId: string, moduleId: string, linkId: string) => Promise<void>;

  addModuleToFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  removeModuleFromFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  updateModuleGanttStructure: (
    workspaceSlug: string,
    projectId: string,
    module: IModule,
    payload: IBlockUpdateData
  ) => void;

  // computed
  projectModules: IModule[] | null;
}

export class ModuleStore implements IModuleStore {
  // states
  loader: boolean = false;
  error: any | null = null;

  // observables
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
      // states
      loader: observable,
      error: observable.ref,

      // observables
      moduleId: observable.ref,
      modules: observable.ref,
      moduleDetails: observable.ref,
      issues: observable.ref,

      // actions
      setModuleId: action,

      getModuleById: action,

      fetchModules: action,
      fetchModuleDetails: action,

      createModule: action,
      updateModuleDetails: action,
      deleteModule: action,

      createModuleLink: action,
      updateModuleLink: action,
      deleteModuleLink: action,

      addModuleToFavorites: action,
      removeModuleFromFavorites: action,
      updateModuleGanttStructure: action,

      // computed
      projectModules: computed,
    });

    this.rootStore = _rootStore;

    // services
    this.projectService = new ProjectService();
    this.moduleService = new ModuleService();
  }

  // computed
  get projectModules() {
    if (!this.rootStore.project.projectId) return null;

    return this.modules[this.rootStore.project.projectId] || null;
  }

  getModuleById = (moduleId: string) => this.moduleDetails[moduleId] || null;

  // actions
  setModuleId = (moduleId: string | null) => {
    this.moduleId = moduleId;
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

      runInAction(() => {
        this.moduleDetails = {
          ...this.moduleDetails,
          [moduleId]: response,
        };
        this.loader = false;
        this.error = null;
      });

      return response;
    } catch (error) {
      console.error("Failed to fetch module details in module store", error);

      runInAction(() => {
        this.loader = false;
        this.error = error;
      });

      throw error;
    }
  };

  createModule = async (workspaceSlug: string, projectId: string, data: Partial<IModule>) => {
    try {
      const response = await this.moduleService.createModule(workspaceSlug, projectId, data);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: [...this.modules[projectId], response],
        };
        this.loader = false;
        this.error = null;
      });
      this.fetchModules(workspaceSlug, projectId);
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

      const response = await this.moduleService.patchModule(workspaceSlug, projectId, moduleId, data);

      return response;
    } catch (error) {
      console.error("Failed to update module in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
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

      await this.moduleService.deleteModule(workspaceSlug, projectId, moduleId);
    } catch (error) {
      console.error("Failed to delete module in module store", error);

      this.fetchModules(workspaceSlug, projectId);

      runInAction(() => {
        this.error = error;
      });
    }
  };

  createModuleLink = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<ILinkDetails>
  ) => {
    try {
      const response = await this.moduleService.createModuleLink(workspaceSlug, projectId, moduleId, data);

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId]?.map((module) =>
            module.id === moduleId ? { ...module, link_module: [response, ...module.link_module] } : module
          ),
        };
        this.moduleDetails = {
          ...this.moduleDetails,
          [moduleId]: {
            ...this.moduleDetails[moduleId],
            link_module: [response, ...this.moduleDetails[moduleId].link_module],
          },
        };
      });

      return response;
    } catch (error) {
      console.error("Failed to create module link in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  updateModuleLink = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    linkId: string,
    data: Partial<ILinkDetails>
  ) => {
    try {
      const response = await this.moduleService.updateModuleLink(workspaceSlug, projectId, moduleId, linkId, data);
      const _modules = {
        ...this.modules,
        [projectId]: this.modules[projectId]?.map((module) =>
          module.id === moduleId
            ? {
                ...module,
                link_module: module.link_module.map((link) => (link.id === linkId ? response : link)),
              }
            : module
        ),
      };

      const _moduleDetails = {
        ...this.moduleDetails,
        [moduleId]: {
          ...this.moduleDetails[moduleId],
          link_module: this.moduleDetails[moduleId].link_module.map((link) => (link.id === linkId ? response : link)),
        },
      };

      runInAction(() => {
        this.modules = _modules;
        this.moduleDetails = _moduleDetails;
      });

      return response;
    } catch (error) {
      console.error("Failed to update module link in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
    }
  };

  deleteModuleLink = async (workspaceSlug: string, projectId: string, moduleId: string, linkId: string) => {
    try {
      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: this.modules[projectId]?.map((module) =>
            module.id === moduleId
              ? { ...module, link_module: module.link_module.filter((link) => link.id !== linkId) }
              : module
          ),
        };
        this.moduleDetails = {
          ...this.moduleDetails,
          [moduleId]: {
            ...this.moduleDetails[moduleId],
            link_module: this.moduleDetails[moduleId].link_module.filter((link) => link.id !== linkId),
          },
        };
      });

      await this.moduleService.deleteModuleLink(workspaceSlug, projectId, moduleId, linkId);
    } catch (error) {
      console.error("Failed to delete module link in module store", error);

      this.fetchModules(workspaceSlug, projectId);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);

      runInAction(() => {
        this.error = error;
      });

      throw error;
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

  updateModuleGanttStructure = (
    workspaceSlug: string,
    projectId: string,
    module: IModule,
    payload: IBlockUpdateData
  ) => {
    const modulesList = this.modules[projectId];

    try {
      const newModules = modulesList?.map((p: any) => ({
        ...p,
        ...(p.id === module.id
          ? {
              start_date: payload.start_date ? payload.start_date : p.start_date,
              target_date: payload.target_date ? payload.target_date : p.target_date,
              sort_order: payload.sort_order ? payload.sort_order.newSortOrder : p.sort_order,
            }
          : {}),
      }));

      if (payload.sort_order) {
        const removedElement = newModules.splice(payload.sort_order.sourceIndex, 1)[0];
        newModules.splice(payload.sort_order.destinationIndex, 0, removedElement);
      }

      runInAction(() => {
        this.modules = {
          ...this.modules,
          [projectId]: newModules,
        };
      });

      const newPayload: any = { ...payload };

      if (newPayload.sort_order && payload.sort_order) newPayload.sort_order = payload.sort_order.newSortOrder;

      this.updateModuleDetails(workspaceSlug, module.project, module.id, newPayload);
    } catch (error) {
      console.error("Failed to update module gantt structure in module store", error);
    }
  };
}
