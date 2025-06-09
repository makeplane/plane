export const transformMentionSuggestions = (projectMembers: any): any[] =>
  projectMembers.map((member: any) => ({
    entity_name: "user_mention",
    entity_identifier: `${member?.id}`,
    id: `${member?.id}`,
    type: "User",
    title: `${member?.displayName}`,
    subtitle: member?.email ?? "",
    avatar: member?.avatarUrl,
    redirect_uri: "",
  }));

export const transformMentionHighlights = (userId: any) => [userId];
