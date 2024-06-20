import { computed, makeObservable } from "mobx";
// editor
import { IMentionHighlight } from "@plane/editor";
// store
import { CoreRootStore } from "@/store/root.store";

export interface IMentionsStore {
  // mentionSuggestions: IMentionSuggestion[];
  mentionHighlights: IMentionHighlight[];
}

export class MentionsStore implements IMentionsStore {
  // root store
  rootStore;

  constructor(_rootStore: CoreRootStore) {
    // rootStore
    this.rootStore = _rootStore;

    makeObservable(this, {
      mentionHighlights: computed,
      // mentionSuggestions: computed
    });
  }

  // get mentionSuggestions() {
  //     const projectMembers = this.rootStore.project.project.

  //     const suggestions = projectMembers === null ? [] : projectMembers.map((member) => ({
  //         id: member.member.id,
  //         type: "User",
  //         title: member.member.display_name,
  //         subtitle: member.member.email ?? "",
  //         avatar: member.member.avatar,
  //         redirect_uri: `/${member.workspace.slug}/profile/${member.member.id}`,
  //     }))

  //     return suggestions
  // }

  get mentionHighlights() {
    const user = this.rootStore.user.data;
    return user ? [user.id] : [];
  }
}
