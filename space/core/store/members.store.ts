import set from "lodash/set";
import { action, computed, makeObservable, observable, runInAction } from "mobx";
import { TPublicMember } from "@/types/member";
import { MemberService } from "../services/member.service";
import { CoreRootStore } from "./root.store";

export interface IIssueMemberStore {
  // observables
  members: TPublicMember[] | undefined;
  // computed actions
  getMemberById: (memberId: string | undefined) => TPublicMember | undefined;
  getMembersByIds: (memberIds: string[]) => TPublicMember[];
  // fetch actions
  fetchMembers: (anchor: string) => Promise<TPublicMember[]>;
}

export class MemberStore implements IIssueMemberStore {
  memberMap: Record<string, TPublicMember> = {};
  memberService: MemberService;
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // observables
      memberMap: observable,
      // computed
      members: computed,
      // fetch action
      fetchMembers: action,
    });
    this.memberService = new MemberService();
    this.rootStore = _rootStore;
  }

  get members() {
    return Object.values(this.memberMap);
  }

  getMemberById = (memberId: string | undefined) => (memberId ? this.memberMap[memberId] : undefined);

  getMembersByIds = (memberIds: string[]) => {
    const currMembers = [];
    for (const memberId of memberIds) {
      const member = this.getMemberById(memberId);
      if (member) {
        currMembers.push(member);
      }
    }

    return currMembers;
  };

  fetchMembers = async (anchor: string) => {
    try {
      const membersResponse = await this.memberService.getAnchorMembers(anchor);
      runInAction(() => {
        this.memberMap = {};
        for (const member of membersResponse) {
          set(this.memberMap, [member.member], member);
        }
      });
      return membersResponse;
    } catch (error) {
      console.error("Failed to fetch members:", error);
      return [];
    }
  };
}
