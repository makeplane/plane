import { makeObservable, observable } from "mobx";
import { computedFn } from "mobx-utils";
// plane imports
import { IUserLite } from "@plane/types";
// plane web imports
import { IProjectMemberStore, ProjectMemberStore } from "@/plane-web/store/member/project-member.store";
import { RootStore } from "@/plane-web/store/root.store";
// local imports
import { IWorkspaceMemberStore, WorkspaceMemberStore } from "./workspace-member.store";

export interface IMemberRootStore {
  // observables
  memberMap: Record<string, IUserLite>;
  // computed actions
  getMemberIds: () => string[];
  getUserDetails: (userId: string) => IUserLite | undefined;
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;
}

export class MemberRootStore implements IMemberRootStore {
  // observables
  memberMap: Record<string, IUserLite> = {};
  // sub-stores
  workspace: IWorkspaceMemberStore;
  project: IProjectMemberStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // observables
      memberMap: observable,
    });
    // sub-stores
    this.workspace = new WorkspaceMemberStore(this, _rootStore);
    this.project = new ProjectMemberStore(this, _rootStore);
  }

  /**
   * @description get all member ids
   */
  getMemberIds = computedFn(() => Object.keys(this.memberMap));

  /**
   * @description get user details from userId
   * @param userId
   */
  getUserDetails = computedFn((userId: string): IUserLite | undefined => this.memberMap?.[userId] ?? undefined);
}
