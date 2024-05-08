import concat from "lodash/concat";
import set from "lodash/set";
import sortBy from "lodash/sortBy";
import update from "lodash/update";
import { action, computed, observable, makeObservable, runInAction } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { IModule, ILinkDetails } from "@plane/types";
// helpers
import { orderModules, shouldFilterModule } from "@/helpers/module.helper";
// services
import { ModuleService } from "@/services/module.service";
import { ModuleArchiveService } from "@/services/module_archive.service";
import { ProjectService } from "@/services/project";
// store
import { RootStore } from "@/store/root.store";

export interface IModuleStore {
  //Loaders
  loader: boolean;
  fetchedMap: Record<string, boolean>;
  // observables
  moduleMap: Record<string, IModule>;
  // computed
  projectModuleIds: string[] | null;
  projectArchivedModuleIds: string[] | null;
  // computed actions
  getFilteredModuleIds: (projectId: string) => string[] | null;
  getFilteredArchivedModuleIds: (projectId: string) => string[] | null;
  getModuleById: (moduleId: string) => IModule | null;
  getModuleNameById: (moduleId: string) => string;
  getProjectModuleIds: (projectId: string) => string[] | null;
  // actions
  // fetch
  fetchWorkspaceModules: (workspaceSlug: string) => Promise<IModule[]>;
  fetchModules: (workspaceSlug: string, projectId: string) => Promise<undefined | IModule[]>;
  fetchArchivedModules: (workspaceSlug: string, projectId: string) => Promise<undefined | IModule[]>;
  fetchArchivedModuleDetails: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<IModule>;
  fetchModuleDetails: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<IModule>;
  // crud
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
  // favorites
  addModuleToFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  removeModuleFromFavorites: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  // archive
  archiveModule: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
  restoreModule: (workspaceSlug: string, projectId: string, moduleId: string) => Promise<void>;
}

export class ModulesStore implements IModuleStore {
  // observables
  loader: boolean = false;
  moduleMap: Record<string, IModule> = {};
  //loaders
  fetchedMap: Record<string, boolean> = {};
  // root store
  rootStore;
  // services
  projectService;
  moduleService;
  moduleArchiveService;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      loader: observable.ref,
      moduleMap: observable,
      fetchedMap: observable,
      // computed
      projectModuleIds: computed,
      projectArchivedModuleIds: computed,
      // actions
      fetchWorkspaceModules: action,
      fetchModules: action,
      fetchArchivedModules: action,
      fetchArchivedModuleDetails: action,
      fetchModuleDetails: action,
      createModule: action,
      updateModuleDetails: action,
      deleteModule: action,
      createModuleLink: action,
      updateModuleLink: action,
      deleteModuleLink: action,
      addModuleToFavorites: action,
      removeModuleFromFavorites: action,
      archiveModule: action,
      restoreModule: action,
    });

    this.rootStore = _rootStore;

    // services
    this.projectService = new ProjectService();
    this.moduleService = new ModuleService();
    this.moduleArchiveService = new ModuleArchiveService();
  }

  // computed
  /**
   * get all module ids for the current project
   */
  get projectModuleIds() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    let projectModules = Object.values(this.moduleMap).filter((m) => m.project_id === projectId && !m?.archived_at);
    projectModules = sortBy(projectModules, [(m) => m.sort_order]);
    const projectModuleIds = projectModules.map((m) => m.id);
    return projectModuleIds || null;
  }

  /**
   * get all archived module ids for the current project
   */
  get projectArchivedModuleIds() {
    const projectId = this.rootStore.router.projectId;
    if (!projectId || !this.fetchedMap[projectId]) return null;
    let archivedModules = Object.values(this.moduleMap).filter((m) => m.project_id === projectId && !!m?.archived_at);
    archivedModules = sortBy(archivedModules, [(m) => m.sort_order]);
    const projectModuleIds = archivedModules.map((m) => m.id);
    return projectModuleIds || null;
  }

  /**
   * @description returns filtered module ids based on display filters and filters
   * @param {TModuleDisplayFilters} displayFilters
   * @param {TModuleFilters} filters
   * @returns {string[] | null}
   */
  getFilteredModuleIds = computedFn((projectId: string) => {
    const displayFilters = this.rootStore.moduleFilter.getDisplayFiltersByProjectId(projectId);
    const filters = this.rootStore.moduleFilter.getFiltersByProjectId(projectId);
    const searchQuery = this.rootStore.moduleFilter.searchQuery;
    if (!this.fetchedMap[projectId]) return null;
    let modules = Object.values(this.moduleMap ?? {}).filter(
      (m) =>
        m.project_id === projectId &&
        !m.archived_at &&
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        shouldFilterModule(m, displayFilters ?? {}, filters ?? {})
    );
    modules = orderModules(modules, displayFilters?.order_by);
    const moduleIds = modules.map((m) => m.id);
    return moduleIds;
  });

  /**
   * @description returns filtered archived module ids based on display filters and filters
   * @param {string} projectId
   * @returns {string[] | null}
   */
  getFilteredArchivedModuleIds = computedFn((projectId: string) => {
    const displayFilters = this.rootStore.moduleFilter.getDisplayFiltersByProjectId(projectId);
    const filters = this.rootStore.moduleFilter.getArchivedFiltersByProjectId(projectId);
    const searchQuery = this.rootStore.moduleFilter.archivedModulesSearchQuery;
    if (!this.fetchedMap[projectId]) return null;
    let modules = Object.values(this.moduleMap ?? {}).filter(
      (m) =>
        m.project_id === projectId &&
        !!m.archived_at &&
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        shouldFilterModule(m, displayFilters ?? {}, filters ?? {})
    );
    modules = orderModules(modules, displayFilters?.order_by);
    const moduleIds = modules.map((m) => m.id);
    return moduleIds;
  });

  /**
   * @description get module by id
   * @param moduleId
   * @returns IModule | null
   */
  getModuleById = computedFn((moduleId: string) => this.moduleMap?.[moduleId] || null);

  /**
   * @description get module by id
   * @param moduleId
   * @returns IModule | null
   */
  getModuleNameById = computedFn((moduleId: string) => this.moduleMap?.[moduleId]?.name);

  /**
   * @description returns list of module ids of the project id passed as argument
   * @param projectId
   */
  getProjectModuleIds = computedFn((projectId: string) => {
    if (!this.fetchedMap[projectId]) return null;

    let projectModules = Object.values(this.moduleMap).filter((m) => m.project_id === projectId && !m.archived_at);
    projectModules = sortBy(projectModules, [(m) => m.sort_order]);
    const projectModuleIds = projectModules.map((m) => m.id);
    return projectModuleIds;
  });

  /**
   * @description fetch all modules
   * @param workspaceSlug
   * @returns IModule[]
   */
  fetchWorkspaceModules = async (workspaceSlug: string) =>
    await this.moduleService.getWorkspaceModules(workspaceSlug).then((response) => {
      runInAction(() => {
        response.forEach((module) => {
          set(this.moduleMap, [module.id], { ...this.moduleMap[module.id], ...module });
        });
      });
      return response;
    });

  /**
   * @description fetch all modules
   * @param workspaceSlug
   * @param projectId
   * @returns IModule[]
   */
  fetchModules = async (workspaceSlug: string, projectId: string) => {
    try {
      this.loader = true;
      await this.moduleService.getModules(workspaceSlug, projectId).then((response) => {
        runInAction(() => {
          response.forEach((module) => {
            set(this.moduleMap, [module.id], { ...this.moduleMap[module.id], ...module });
          });
          set(this.fetchedMap, projectId, true);
          this.loader = false;
        });
        return response;
      });
    } catch (error) {
      this.loader = false;
      return undefined;
    }
  };

  /**
   * @description fetch all archived modules
   * @param workspaceSlug
   * @param projectId
   * @returns IModule[]
   */
  fetchArchivedModules = async (workspaceSlug: string, projectId: string) => {
    this.loader = true;
    return await this.moduleArchiveService
      .getArchivedModules(workspaceSlug, projectId)
      .then((response) => {
        runInAction(() => {
          response.forEach((module) => {
            set(this.moduleMap, [module.id], { ...this.moduleMap[module.id], ...module });
          });
          this.loader = false;
        });
        return response;
      })
      .catch(() => {
        this.loader = false;
        return undefined;
      });
  };

  /**
   * @description fetch module details
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @returns IModule
   */
  fetchArchivedModuleDetails = async (workspaceSlug: string, projectId: string, moduleId: string) =>
    await this.moduleArchiveService.getArchivedModuleDetails(workspaceSlug, projectId, moduleId).then((response) => {
      runInAction(() => {
        set(this.moduleMap, [response.id], { ...this.moduleMap?.[response.id], ...response });
      });
      return response;
    });

  /**
   * @description fetch module details
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @returns IModule
   */
  fetchModuleDetails = async (workspaceSlug: string, projectId: string, moduleId: string) =>
    await this.moduleService.getModuleDetails(workspaceSlug, projectId, moduleId).then((response) => {
      runInAction(() => {
        set(this.moduleMap, [moduleId], response);
      });
      return response;
    });

  /**
   * @description creates a new module
   * @param workspaceSlug
   * @param projectId
   * @param data
   * @returns IModule
   */
  createModule = async (workspaceSlug: string, projectId: string, data: Partial<IModule>) =>
    await this.moduleService.createModule(workspaceSlug, projectId, data).then((response) => {
      runInAction(() => {
        set(this.moduleMap, [response?.id], response);
      });
      return response;
    });

  /**
   * @description updates module details
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param data
   * @returns IModule
   */
  updateModuleDetails = async (workspaceSlug: string, projectId: string, moduleId: string, data: Partial<IModule>) => {
    const originalModuleDetails = this.getModuleById(moduleId);
    try {
      runInAction(() => {
        set(this.moduleMap, [moduleId], { ...originalModuleDetails, ...data });
      });
      const response = await this.moduleService.patchModule(workspaceSlug, projectId, moduleId, data);
      this.fetchModuleDetails(workspaceSlug, projectId, moduleId);
      return response;
    } catch (error) {
      console.error("Failed to update module in module store", error);
      runInAction(() => {
        set(this.moduleMap, [moduleId], { ...originalModuleDetails });
      });
      throw error;
    }
  };

  /**
   * @description deletes a module
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   */
  deleteModule = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    const moduleDetails = this.getModuleById(moduleId);
    if (!moduleDetails) return;
    await this.moduleService.deleteModule(workspaceSlug, projectId, moduleId).then(() => {
      runInAction(() => {
        delete this.moduleMap[moduleId];
      });
    });
  };

  /**
   * @description creates a new module link
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param data
   * @returns ILinkDetails
   */
  createModuleLink = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    data: Partial<ILinkDetails>
  ) => {
    try {
      const moduleLink = await this.moduleService.createModuleLink(workspaceSlug, projectId, moduleId, data);
      runInAction(() => {
        update(this.moduleMap, [moduleId, "link_module"], (moduleLinks = []) => concat(moduleLinks, moduleLink));
      });
      return moduleLink;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description updates module link details
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param linkId
   * @param data
   * @returns ILinkDetails
   */
  updateModuleLink = async (
    workspaceSlug: string,
    projectId: string,
    moduleId: string,
    linkId: string,
    data: Partial<ILinkDetails>
  ) => {
    const originalModuleDetails = this.getModuleById(moduleId);
    try {
      const linkModules = originalModuleDetails?.link_module?.map((link) =>
        link.id === linkId ? { ...link, ...data } : link
      );
      runInAction(() => {
        set(this.moduleMap, [moduleId, "link_module"], linkModules);
      });
      const response = await this.moduleService.updateModuleLink(workspaceSlug, projectId, moduleId, linkId, data);
      return response;
    } catch (error) {
      console.error("Failed to update module link in module store", error);
      runInAction(() => {
        set(this.moduleMap, [moduleId, "link_module"], originalModuleDetails?.link_module);
      });
      throw error;
    }
  };

  /**
   * @description deletes a module link
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @param linkId
   */
  deleteModuleLink = async (workspaceSlug: string, projectId: string, moduleId: string, linkId: string) => {
    try {
      const moduleLink = await this.moduleService.deleteModuleLink(workspaceSlug, projectId, moduleId, linkId);
      runInAction(() => {
        update(this.moduleMap, [moduleId, "link_module"], (moduleLinks = []) =>
          moduleLinks.filter((link: ILinkDetails) => link.id !== linkId)
        );
      });
      return moduleLink;
    } catch (error) {
      throw error;
    }
  };

  /**
   * @description adds a module to favorites
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @returns
   */
  addModuleToFavorites = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      const moduleDetails = this.getModuleById(moduleId);
      if (moduleDetails?.is_favorite) return;
      runInAction(() => {
        set(this.moduleMap, [moduleId, "is_favorite"], true);
      });
      await this.moduleService.addModuleToFavorites(workspaceSlug, projectId, {
        module: moduleId,
      });
    } catch (error) {
      console.error("Failed to add module to favorites in module store", error);
      runInAction(() => {
        set(this.moduleMap, [moduleId, "is_favorite"], false);
      });
    }
  };

  /**
   * @description removes a module from favorites
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @returns
   */
  removeModuleFromFavorites = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    try {
      const moduleDetails = this.getModuleById(moduleId);
      if (!moduleDetails?.is_favorite) return;
      runInAction(() => {
        set(this.moduleMap, [moduleId, "is_favorite"], false);
      });
      await this.moduleService.removeModuleFromFavorites(workspaceSlug, projectId, moduleId);
    } catch (error) {
      console.error("Failed to remove module from favorites in module store", error);
      runInAction(() => {
        set(this.moduleMap, [moduleId, "is_favorite"], true);
      });
    }
  };

  /**
   * @description archives a module
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @returns
   */
  archiveModule = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    const moduleDetails = this.getModuleById(moduleId);
    if (moduleDetails?.archived_at) return;
    await this.moduleArchiveService
      .archiveModule(workspaceSlug, projectId, moduleId)
      .then((response) => {
        runInAction(() => {
          set(this.moduleMap, [moduleId, "archived_at"], response.archived_at);
        });
      })
      .catch((error) => {
        console.error("Failed to archive module in module store", error);
      });
  };

  /**
   * @description restores a module
   * @param workspaceSlug
   * @param projectId
   * @param moduleId
   * @returns
   */
  restoreModule = async (workspaceSlug: string, projectId: string, moduleId: string) => {
    const moduleDetails = this.getModuleById(moduleId);
    if (!moduleDetails?.archived_at) return;
    await this.moduleArchiveService
      .restoreModule(workspaceSlug, projectId, moduleId)
      .then(() => {
        runInAction(() => {
          set(this.moduleMap, [moduleId, "archived_at"], null);
        });
      })
      .catch((error) => {
        console.error("Failed to restore module in module store", error);
      });
  };
}
