// store
import type { IBaseWorkspaceMemberStore } from "@/store/member/workspace/workspace-member.store";
import { BaseWorkspaceMemberStore } from "@/store/member/workspace/workspace-member.store";
import type { RootStore } from "@/plane-web/store/root.store";
import type { IMemberRootStore } from "@/store/member";

export type IWorkspaceMemberStore = IBaseWorkspaceMemberStore;

export class WorkspaceMemberStore extends BaseWorkspaceMemberStore implements IWorkspaceMemberStore {
  constructor(_memberRoot: IMemberRootStore, _rootStore: RootStore) {
    super(_memberRoot, _rootStore);
  }
}
