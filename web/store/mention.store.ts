import { computed, makeObservable } from "mobx";
// editor
import { IMentionHighlight, IMentionSuggestion } from "@plane/lite-text-editor";
// types
import { RootStore } from "store/root.store";

export interface IMentionStore {
  // computed
  mentionSuggestions: IMentionSuggestion[];
  mentionHighlights: IMentionHighlight[];
}

export class MentionStore implements IMentionStore {
  // root store
  rootStore;

  constructor(_rootStore: RootStore) {
    makeObservable(this, {
      // computed
      mentionHighlights: computed,
      mentionSuggestions: computed,
    });
    // rootStore
    this.rootStore = _rootStore;
  }

  /**
   * @description returns a list of mention suggestions
   */
  get mentionSuggestions() {
    const workspaceSlug = this.rootStore.app.router.workspaceSlug;
    const projectMemberIds = this.rootStore.memberRoot.project.projectMemberIds;

    const suggestions = (projectMemberIds ?? [])?.map((memberId) => {
      const memberDetails = this.rootStore.memberRoot.project.getProjectMemberDetails(memberId);

      return {
        id: `${memberDetails?.member?.id}`,
        type: "User",
        title: `${memberDetails?.member?.display_name}`,
        subtitle: memberDetails?.member?.email ?? "",
        avatar: `${memberDetails?.member?.avatar}`,
        redirect_uri: `/${workspaceSlug}/profile/${memberDetails?.member?.id}`,
      };
    });

    return suggestions;
  }

  get mentionHighlights() {
    const user = this.rootStore.user.currentUser;
    return user ? [user.id] : [];
  }
}
