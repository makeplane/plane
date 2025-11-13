import { makeObservable, observable } from "mobx";
import type { IWorkspaceStore } from "./workspace.store";

export interface IUserStore {
  user: any;
  workspaces: Map<string, IWorkspaceStore>;
  isLoading: boolean;
  error: any;
}

export class UserStore implements IUserStore {
  user: any = null;
  workspaces: Map<string, IWorkspaceStore> = new Map();
  isLoading: boolean = false;
  error: any = null;

  constructor() {
    makeObservable(this, {
      user: observable.ref,
      workspaces: observable,
      isLoading: observable.ref,
      error: observable.ref,
    });
  }
}

// userStore.ts

// class UserStore {
//   user: User | null = null;
//   workspaces: Workspace[] = [];
//   isLoading = false;
//   error: string | null = null;
//   private indexedDBService: IndexedDBService;

//   constructor() {
//     makeAutoObservable(this);
//     this.indexedDBService = new IndexedDBService();
//     this.init();
//   }

//   private async init() {
//     try {
//       await this.indexedDBService.init();
//       await this.loadWorkspacesFromIndexedDB();
//     } catch (error) {
//       runInAction(() => {
//         this.error = "Failed to initialize store";
//         console.error("Store initialization error:", error);
//       });
//     }
//   }

//   setUser(user: User | null) {
//     this.user = user;
//   }

//   async loadWorkspacesFromIndexedDB() {
//     try {
//       const workspaces = await this.indexedDBService.getWorkspaces();
//       runInAction(() => {
//         this.workspaces = workspaces;
//       });
//     } catch (error) {
//       runInAction(() => {
//         this.error = "Failed to load workspaces from IndexedDB";
//         console.error("Load workspaces error:", error);
//       });
//     }
//   }

//   async fetchAndSyncWorkspaces() {
//     this.isLoading = true;
//     this.error = null;

//     try {
//       // Simulate API call to fetch workspaces
//       const response = await fetch("/api/workspaces");
//       const workspaces = await response.json();

//       // Save to IndexedDB
//       await this.indexedDBService.saveWorkspaces(workspaces);

//       // Update MobX store
//       runInAction(() => {
//         this.workspaces = workspaces;
//         this.isLoading = false;
//       });
//     } catch (error) {
//       runInAction(() => {
//         this.error = "Failed to fetch workspaces";
//         this.isLoading = false;
//         console.error("Fetch workspaces error:", error);
//       });
//     }
//   }

//   // Additional methods for workspace management
//   async addWorkspace(workspace: Omit<Workspace, "id" | "createdAt" | "updatedAt">) {
//     this.isLoading = true;
//     this.error = null;

//     try {
//       // Simulate API call to create workspace
//       const response = await fetch("/api/workspaces", {
//         method: "POST",
//         body: JSON.stringify(workspace),
//       });
//       const newWorkspace = await response.json();

//       // Update local storage and state
//       const updatedWorkspaces = [...this.workspaces, newWorkspace];
//       await this.indexedDBService.saveWorkspaces(updatedWorkspaces);

//       runInAction(() => {
//         this.workspaces.push(newWorkspace);
//         this.isLoading = false;
//       });
//     } catch (error) {
//       runInAction(() => {
//         this.error = "Failed to add workspace";
//         this.isLoading = false;
//         console.error("Add workspace error:", error);
//       });
//     }
//   }

//   logout() {
//     this.user = null;
//     this.workspaces = [];
//     // Optionally clear IndexedDB data
//     this.indexedDBService.init().then(() => {
//       this.indexedDBService.saveWorkspaces([]);
//     });
//   }
// }
