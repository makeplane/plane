import { PlaneUser } from "@plane/sdk";

export const replaceMentionedGhUsers = (
  html: string,
  workspaceSlug: string,
  userMap: Record<string, string>,
  planeUsers: PlaneUser[]
) => {
  // Check if there is an @Pattern in there if there is a @Pattern, replace that
  // with the github url of that user
  const pattern = /@([a-zA-Z0-9-]+)/g;
  const matches = html.match(pattern);
  if (matches) {
    matches.forEach((match) => {
      const username = match.slice(1);

      // Only add link if the user does not exists in the userMap
      if (!userMap[username]) {
        html = html.replace(match, `<a href=https://github.com/${username}>From GitHub: ${username}</a>`);
      } else {
        // Get the user from the planeUsers
        const user = planeUsers.find((user) => user.id === userMap[username]);
        // If the user exist then replace the user with the mention component,
        // else keep the link to the github user
        if (user) {
          const component = createMentionComponent(workspaceSlug, user);
          html = html.replace(match, component);
        } else {
          html = html.replace(match, `<a href=https://github.com/${username}>From GitHub: ${username}</a>`);
        }
      }
    });
    return html;
  }

  return html;
};

export const createMentionComponent = (workspaceSlug: string, user: PlaneUser): string => `<mention-component
    entity_name="user_mention"
		label="${user.display_name}"
    entity_identifier="${user.id}"
    id="${user.id}"
		type="User"
    title="${user.display_name}"
		subtitle="${user.email ?? ""}"
		avatar="${user.avatar}"
    redirect_uri="/${workspaceSlug}/profile/${user.id}"
  ></mention-component>`;

export const replaceIssueNumber = (html: string, repo: string) => {
  const pattern = /#(\d+)/g;
  const matches = html.match(pattern);
  if (matches) {
    matches.forEach((match) => {
      const issueNumber = match.slice(1);
      html = html.replace(
        match,
        `<a href=https://github.com/${repo}/issues/${issueNumber}>${repo} #${issueNumber}</a>`
      );
    });
    return html;
  }

  return html;
};
