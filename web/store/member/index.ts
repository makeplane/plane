import { makeObservable, observable } from "mobx";
// types
import { RootStore } from "store/root.store";
import { IUserLite } from "types";
import { IWorkspaceMemberStore, WorkspaceMemberStore } from "./workspace-member.store";
import { IProjectMemberStore, ProjectMemberStore } from "./project-member.store";

export interface IMemberRootStore {
  // observables
  memberMap: Record<string, IUserLite>;
  // sub-stores
  workspaceMember: IWorkspaceMemberStore;
  projectMember: IProjectMemberStore;
}

export class MemberRootStore implements IMemberRootStore {
  // observables
  memberMap: Record<string, IUserLite> = {};
  // root store
  rootStore: RootStore;
  // sub-stores
  workspaceMember: IWorkspaceMemberStore;
  projectMember: IProjectMemberStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      memberMap: observable,
    });

    // root store
    this.rootStore = _rootStore;
    // sub-stores
    this.workspaceMember = new WorkspaceMemberStore(_rootStore);
    this.projectMember = new ProjectMemberStore(_rootStore);
  }
}
