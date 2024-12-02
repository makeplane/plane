import { IMentionSuggestion } from "@plane/editor";

export const getMentionSuggestions = (
  projectMembers: any
): IMentionSuggestion[] =>
  projectMembers.map((member: any) => ({
    entity_name: "user_mention",
    entity_identifier: `${member?.id}`,
    id: `${member?.id}`,
    type: "User",
    title: `${member?.displayName}`,
    subtitle: member?.email ?? "",
    avatar: `${member?.avatar}`,
    redirect_uri: "",
  }));

export const getMentionHighlights = (userId: any) => [userId];
