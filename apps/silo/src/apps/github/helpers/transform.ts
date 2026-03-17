/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type {
  WebhookGitHubIssue,
  GithubService,
  WebhookGitHubComment,
  GithubIssue,
  WebhookGitHubUser,
} from "@plane/etl/github";
import { transformPlaneLabel } from "@plane/etl/github";
import type { Client, PlaneUser, ExIssue as PlaneIssue, ExIssueComment, ExIssueLabel } from "@plane/sdk";
import type { TIssueStateMap } from "@plane/types";
import { E_INTEGRATION_KEYS, E_ISSUE_STATE_MAP_KEYS } from "@plane/types";
import { GithubContentParser } from "./content-parser";

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

export const transformGitHubIssue = async (
  issue: WebhookGitHubIssue,
  issueHTML: string,
  imagePrefix: string,
  planeClient: Client,
  repository: string,
  userMap: Record<string, string>,
  issueStateMap: TIssueStateMap | undefined,
  workspaceSlug: string,
  projectId: string,
  planeUsers: PlaneUser[],
  githubService: GithubService,
  ghIntegrationKey: E_INTEGRATION_KEYS,
  isUpdate: boolean = false
): Promise<Partial<PlaneIssue>> => {
  const links = [
    {
      name: "Linked GitHub Issue",
      url: `https://github.com/${repository}/issues/${issue.number}`,
    },
  ];

  let creator: string | undefined;

  if (issue.user && issue.user.type === "User") {
    creator = userMap[issue.user.login];
  }

  let issue_html = `${issueHTML.replaceAll("\n", "") || ""}`;

  const imageMap = GithubContentParser.extractImageInfo(issueHTML);
  issue_html = await GithubContentParser.toPlaneHtml(issue_html, imagePrefix, imageMap, {
    planeClient,
    workspaceSlug,
    projectId,
    userMap,
    planeUsers,
    repo: repository,
    githubService,
  });

  // Replace the issue number with the actual issue number in github
  issue_html = replaceIssueNumber(issue_html, repository);
  // Replace the mentioned github users in the issue body
  issue_html = replaceMentionedGhUsers(issue_html, workspaceSlug, userMap, planeUsers);

  let labels = issue.labels?.map((label) => (typeof label === "string" ? label : label.name)) || [];
  labels = labels.filter((label) => label.toLowerCase() !== "plane");

  let targetState: string | undefined = undefined;
  if (issue.state) {
    const states = (await planeClient.state.list(workspaceSlug, projectId)).results;
    const backlogState = states.find((state) => state.group === "backlog");
    const doneState = states.find((state) => state.group === "completed");
    if (issue.state === "open") {
      targetState = backlogState?.id;
    } else if (issue.state === "closed") {
      targetState = doneState?.id;
    }
  }

  // if they have configured the issue state map, use it to set the target state
  if (issueStateMap && Object.keys(issueStateMap).length > 0) {
    if (issue.state === "open") {
      targetState = issueStateMap[E_ISSUE_STATE_MAP_KEYS.ISSUE_OPEN]?.id;
    } else if (issue.state === "closed") {
      targetState = issueStateMap[E_ISSUE_STATE_MAP_KEYS.ISSUE_CLOSED]?.id;
    }
  }

  return {
    external_id: issue.number.toString(),
    external_source: ghIntegrationKey,
    created_by: creator,
    name: issue.title,
    description_html: issue_html,
    created_at: issue.created_at,
    state: targetState,
    labels: labels,
    links,
  };
};

export const transformGitHubComment = async (
  comment: WebhookGitHubComment,
  commentHtml: string,
  imagePrefix: string,
  issueId: string,
  repository: string,
  workspaceSlug: string,
  projectId: string,
  planeClient: Client,
  githubService: GithubService,
  userMap: Record<string, string>,
  planeUsers: PlaneUser[],
  isUpdate: boolean = false
): Promise<Partial<ExIssueComment>> => {
  let creator: string | undefined;

  if (comment.user && comment.user.type === "User") {
    creator = userMap[comment.user.login];
    const isUserProjectMember = planeUsers.some((user) => user.id === creator);
    // if the user is not a project member, set the creator to undefined and the comment will be created by the Bot
    if (!isUserProjectMember) {
      creator = undefined;
    }
  }

  let comment_html = `${commentHtml || "<p></p>"}`;

  if (!creator) {
    const commentBody = (commentHtml || "<p></p>").trim();
    const currentUserReference = `<a href="${comment.user?.html_url}">${comment.user?.login}</a>`;

    // Regular expression to match the existing creator reference
    const creatorReferenceRegex = /Comment (updated|created) on GitHub By \[(.*?)\]\((.*?)\)/gim;

    let updatedBody;
    if (creatorReferenceRegex.test(commentBody)) {
      // Update existing reference and add new one
      updatedBody = commentBody.replace(creatorReferenceRegex, "").trim();
    } else {
      // Use the original comment body
      updatedBody = commentBody;
    }

    // Add new creator reference
    const creatorReference = `Comment ${isUpdate ? "updated" : "created"} on GitHub By ${currentUserReference}`;

    // Combine the body and creator reference, replacing multiple newlines with a single one
    comment_html = `${updatedBody}\n\n${creatorReference}`
      .replace(/\n{3,}/g, "\n\n")
      .replace(/^\s+|\s+$/g, "") // Remove leading and trailing whitespace
      .replace(/\s*(<\/?p>)\s*/g, "$1"); // Remove spaces around <p> tags

    // Only wrap in <p> tags if it's not already wrapped
    if (!comment_html.startsWith("<p>") && !comment_html.endsWith("</p>")) {
      comment_html = `<p>${comment_html}</p>`;
    }
  }

  const imageMap = GithubContentParser.extractImageInfo(commentHtml);
  comment_html = await GithubContentParser.toPlaneHtml(comment_html, imagePrefix, imageMap, {
    planeClient,
    workspaceSlug,
    projectId,
    userMap,
    planeUsers,
    repo: repository,
    githubService,
  });

  comment_html = replaceIssueNumber(comment_html, repository);
  comment_html = replaceMentionedGhUsers(comment_html, workspaceSlug, userMap, planeUsers);

  return {
    external_id: comment.id.toString(),
    external_source: E_INTEGRATION_KEYS.GITHUB,
    created_at: comment.created_at,
    created_by: creator || undefined,
    comment_html: comment_html,
    actor: creator || undefined,
    issue: issueId,
  };
};

export const transformPlaneIssue = async (
  issue: PlaneIssue,
  imgSrcPrefix: string,
  labels: ExIssueLabel[],
  owner: string,
  repo: string,
  userMap: Record<string, WebhookGitHubUser>,
  issueStateMap: TIssueStateMap | undefined,
  planeClient: Client,
  workspaceSlug: string,
  projectId: string
): Promise<Partial<GithubIssue>> => {
  const githubIssueNumber = issue.links
    ?.find((link) => link.name === "Linked GitHub Issue")
    ?.url.split("/")
    .pop();

  // If there is a github label, remove it and add a plane label
  const issueLabels: ExIssueLabel[] = [];
  const allIssueLabelIds = (issue.labels || []).map((label) => (label as unknown as ExIssueLabel).id);
  labels.forEach((label) => {
    if (allIssueLabelIds.includes(label.id) && label.name.toLowerCase() !== "github") {
      issueLabels.push(label);
    }
  });

  const ghLabels = issueLabels?.map((label) => transformPlaneLabel(label)) || [];
  ghLabels.push({
    name: "plane",
    color: "438bde",
  });

  // Remove the part from the issue body when we mention the creator
  const htmlToRemove = /<p><em>Issue (updated|created) on GitHub By <\/em><a[^>]*><em>[^<]*<\/em><\/a><\/p>/gi;
  const cleanHtml = issue.description_html.replace(htmlToRemove, "");

  // Convert the cleaned HTML to GitHub markdown using our ContentParser
  const githubBody = GithubContentParser.toMarkdown(cleanHtml, imgSrcPrefix);

  // set the target state based on the issue state
  let targetState: string | undefined = undefined;
  if (issue.state) {
    const states = (await planeClient.state.list(workspaceSlug, projectId)).results;
    const issueState = states.find((state) => state.id === issue.state);
    if (issueState?.group === "completed") {
      targetState = "CLOSED";
    } else {
      targetState = "OPEN";
    }
  }

  // if they have configured the issue state map, use it to set the target state
  if (issueStateMap && Object.keys(issueStateMap).length > 0) {
    const planeStateForIssueClosed = issueStateMap[E_ISSUE_STATE_MAP_KEYS.ISSUE_CLOSED]?.id;
    const planeStateForIssueOpen = issueStateMap[E_ISSUE_STATE_MAP_KEYS.ISSUE_OPEN]?.id;
    // if customer mark the issue as a state that they have configured as closed, set the target state to closed
    // if customer mark the issue as a state that they have configured as open, set the target state to open
    if (planeStateForIssueClosed && issue.state === planeStateForIssueClosed) {
      targetState = "CLOSED";
    } else if (planeStateForIssueOpen && issue.state === planeStateForIssueOpen) {
      targetState = "OPEN";
    }
  }

  return {
    id: parseInt(issue.external_id || "0"),
    number: parseInt(githubIssueNumber || "0"),
    title: issue.name,
    body: githubBody,
    owner: owner,
    repo: repo,
    state: targetState,
    created_at: issue.created_at,
    labels: ghLabels,
  };
};
