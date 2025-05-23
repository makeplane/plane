// helpers
import { action, computed, makeObservable, observable, runInAction, set } from "mobx";
import { computedFn } from "mobx-utils";
// types
import { TLoader, TUserApplication, TApplicationCategory } from "@plane/types";
// services
import { ApplicationService } from "@/plane-web/services/marketplace/application.service";
import { CategoryService } from "@/plane-web/services/marketplace/category.service";
// store
import { RootStore } from "@/plane-web/store/root.store";

export interface IApplicationStore {
    // observables
    applicationsLoader: TLoader;
    applicationsMap: Record<string, Record<string, TUserApplication>>; // key: workspaceId | value: <applicationId, application>
    categoriesLoader: TLoader;
    allApplicationCategories: TApplicationCategory[];
    // computed functions
    getApplicationsLoader: (applicationId: string) => TLoader | undefined;
    getApplicationsForWorkspace: (workspaceSlug: string) => TUserApplication[] | undefined;
    getApplicationById: (applicationId: string) => TUserApplication | undefined;
    // actions
    fetchApplications: () => Promise<TUserApplication[] | undefined>;
    fetchApplication: (applicationId: string) => Promise<TUserApplication | undefined>;
    createApplication: (data: Partial<TUserApplication>) => Promise<TUserApplication | undefined>;
    updateApplication: (applicationId: string, data: Partial<TUserApplication>) => Promise<TUserApplication | undefined>;
    deleteApplication: (applicationId: string) => Promise<TUserApplication | undefined>;
    regenerateApplicationSecret: (applicationId: string) => Promise<TUserApplication | undefined>;
    checkApplicationSlug: (slug: string) => Promise<any>;
    fetchApplicationCategories: () => Promise<TApplicationCategory[] | undefined>;
}

export class ApplicationStore implements IApplicationStore {
    // observables
    applicationsLoader: TLoader = "init-loader";
    applicationsMap: Record<string, Record<string, TUserApplication>> = {}; // key: workspaceId | value: applicationsMap
    categoriesLoader: TLoader = "init-loader";
    allApplicationCategories: TApplicationCategory[] = [];
    // service
    applicationService: ApplicationService;
    categoryService: CategoryService;
    // store
    rootStore: RootStore;

    constructor(_rootStore: RootStore) {
        makeObservable(this, {
            // observables
            applicationsLoader: observable,
            applicationsMap: observable,
            categoriesLoader: observable,
            allApplicationCategories: observable,
            // actions
            fetchApplications: action,
            fetchApplication: action,
            createApplication: action,
            updateApplication: action,
            deleteApplication: action,
            regenerateApplicationSecret: action,
            checkApplicationSlug: action,
            fetchApplicationCategories: action,
        });
        // service
        this.applicationService = new ApplicationService();
        this.categoryService = new CategoryService();
        // store
        this.rootStore = _rootStore;
    }

    // computed functions
    getApplicationsLoader = computedFn(() => this.applicationsLoader);

    /**
     * Get applications for a specific workspace
     * @param workspaceSlug - The workspace slug
     * @returns The applications for the given workspace
     */
    getApplicationsForWorkspace = computedFn((workspaceSlug: string): TUserApplication[] | undefined => {
        const applications = this.applicationsMap[workspaceSlug];
        return applications ? Object.values(applications) : [];
    });

    /**
     * Get an application by its ID
     * @param applicationId - The application ID
     * @returns The application with the given ID
     */
    getApplicationById = computedFn((applicationId: string): TUserApplication | undefined => {
        const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
        if (!workspaceSlug) {
            return undefined;
        }
        if (this.applicationsMap[workspaceSlug]) {
            return this.applicationsMap[workspaceSlug][applicationId];
        }
        return undefined;
    })


    // actions
    /**
     * Create a new application
     * @param data - The application data
     * @returns The created application
     */
    createApplication = async (data: Partial<TUserApplication>): Promise<TUserApplication | undefined> => {
        this.applicationsLoader = "init-loader";
        try {
            const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
            if (!workspaceSlug) {
                throw new Error("Workspace not found");
            }
            const response = await this.applicationService.createApplication(workspaceSlug, data);
            if (response) {
                set(this.applicationsMap, workspaceSlug, { [response.id]: response });
                return response;
            }
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        } finally {
            this.applicationsLoader = "loaded"
        }
    }

    /**
     * Update an existing application
     * @param applicationId - The application ID
     * @param data - The application data
     * @returns The updated application
     */
    updateApplication = async (applicationId: string, data: Partial<TUserApplication>): Promise<TUserApplication | undefined> => {
        this.applicationsLoader = "init-loader";
        try {
            const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
            if (!workspaceSlug) {
                throw new Error("Workspace not found");
            }
            const response = await this.applicationService.updateApplication(workspaceSlug, applicationId, data);
            if (response) {
                runInAction(() => {
                    this.applicationsLoader = "loaded";
                    set(this.applicationsMap, workspaceSlug, { [response.id]: response });
                })
            }
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        } finally {
            this.applicationsLoader = "loaded"
        }
    }

    /**
     * Delete an existing application
     * @param applicationId - The application ID
     * @returns The deleted application
     */
    deleteApplication = async (applicationId: string): Promise<TUserApplication | undefined> => {
        this.applicationsLoader = "init-loader";
        try {
            const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
            if (!workspaceSlug) {
                throw new Error("Workspace not found");
            }
            const response = await this.applicationService.deleteApplication(workspaceSlug, applicationId);
            if (response) {
                runInAction(() => {
                    this.applicationsLoader = "loaded";
                    delete this.applicationsMap[workspaceSlug][applicationId];
                })
            }
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        } finally {
            this.applicationsLoader = "loaded"
        }
    }

    /**
     * Fetch all applications for a workspace and stores in mobx store
     * @param
     * @returns The applications for the given workspace
     */
    fetchApplications = async (): Promise<TUserApplication[] | undefined> => {
        this.applicationsLoader = "init-loader";
        try {
            const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
            if (!workspaceSlug) {
                throw new Error("Workspace not found");
            }
            const response = await this.applicationService.getApplications(workspaceSlug);
            if (response) {
                runInAction(() => {
                    this.applicationsLoader = "loaded";
                    response.map((app: TUserApplication) => {
                        set(this.applicationsMap, workspaceSlug, { ...this.applicationsMap[workspaceSlug], [app.id]: app });
                    })
                })
            }
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        } finally {
            this.applicationsLoader = "loaded"
        }
    }

    /**
     * Fetch a specific application by ID
     * @param applicationId - The application ID
     * @returns The application with the given ID
     */
    fetchApplication = async (applicationId: string): Promise<TUserApplication | undefined> => {
        this.applicationsLoader = "init-loader";
        try {
            const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
            if (!workspaceSlug) {
                throw new Error("Workspace not found");
            }
            const response = await this.applicationService.getApplication(workspaceSlug, applicationId);
            if (response) {
                runInAction(() => {
                    this.applicationsLoader = "loaded";
                    set(this.applicationsMap, workspaceSlug, { [response.id]: response });
                })
            }
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        } finally {
            this.applicationsLoader = "loaded"
        }
    }

    /**
     * Regenerate the client secret for an application
     * @param applicationId - The application ID
     * @returns The updated application
     */

    regenerateApplicationSecret = async (applicationId: string): Promise<TUserApplication | undefined> => {
        this.applicationsLoader = "init-loader";
        try {
            const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
            if (!workspaceSlug) {
                throw new Error("Workspace not found");
            }
            const response = await this.applicationService.regenerateApplicationSecret(workspaceSlug, applicationId);
            if (response) {
                runInAction(() => {
                    this.applicationsLoader = "loaded";
                    // just update the secret
                    set(this.applicationsMap, workspaceSlug, { [response.id]: { ...this.applicationsMap[workspaceSlug][response.id], client_secret: response.client_secret } });
                })
            }
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        } finally {
            this.applicationsLoader = "loaded"
        }
    }

    /**
     * Check if the application slug is available
     * @param slug - The application slug
     * @returns The response from the API
     */
    checkApplicationSlug = async (slug: string): Promise<any> => {
        try {
            const workspaceSlug = this.rootStore.workspaceRoot.currentWorkspace?.slug;
            if (!workspaceSlug) {
                throw new Error("Workspace not found");
            }
            const response = await this.applicationService.checkApplicationSlug(workspaceSlug, slug);
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        }
    }

    /**
     * Fetch all application categories
     * @returns The application categories
     */
    fetchApplicationCategories = async (): Promise<TApplicationCategory[] | undefined> => {
        this.categoriesLoader = "init-loader";
        try {
            const response = await this.categoryService.getApplicationCategories();
            if (response) {
                runInAction(() => {
                    this.allApplicationCategories = response;
                })
            }
            return response;
        } catch (error) {
            console.log(error);
            throw error;
        } finally {
            this.categoriesLoader = "loaded"
        }
    }
}