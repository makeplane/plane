import { Store } from "@/apps/engine/worker/base";
import { getConnectionDetails } from "@/apps/github/helpers/helpers";
import { env } from "@/env";
import { getCredentialsForTargetToken } from "@/helpers/credential";
import { logger } from "@/logger";
import { ExIssue, Client as PlaneClient } from "@plane/sdk";
import { TServiceCredentials } from "@silo/core";
import { createGithubService, GithubIssueDedupPayload, transformGitHubIssue, WebhookGitHubIssue } from "@silo/github";

export type IssueWebhookActions =
  | "assigned"
  | "closed"
  | "deleted"
  | "demilestoned"
  | "edited"
  | "labeled"
  | "locked"
  | "milestoned"
  | "opened"
  | "pinned"
  | "reopened"
  | "transferred"
  | "unassigned"
  | "unlabeled"
  | "unlocked"
  | "unpinned";

const SYNC_LABEL = "plane";

export const handleIssueEvents = async (store: Store, action: IssueWebhookActions, data: unknown) => {
  // If the issue number exist inside the store, skip it
  // @ts-ignore
  if (data && data.issue && data.issue.number) {
    // @ts-ignore
    const exist = await store.get(`silo:issue:${data.issue.number}`);
    if (exist) {
      logger.info("[GITHUB][ISSUES] Event Processed Successfully, confirmed by target");
      // Remove the webhook from the store
      // @ts-ignore
      await store.del(`silo:issue:${data.issue.number}`);
      return true;
    }
  }

  await syncIssueWithPlane(store, data as GithubIssueDedupPayload);
  return true;
};

export const shouldSync = (labels: { name: string }[]): boolean => {
  return labels.some((label) => label.name.toLowerCase() === SYNC_LABEL);
};

export const syncIssueWithPlane = async (store: Store, data: GithubIssueDedupPayload) => {
  try {
    const planeCredentials = await getCredentialsForTargetToken(data.installationId.toString());

    const { workspaceConnection, entityConnection } = await getConnectionDetails({
      accountId: data.accountId.toString(),
      credentials: planeCredentials as TServiceCredentials,
      installationId: data.installationId.toString(),
      repositoryId: data.repositoryId.toString(),
    });

    const planeClient = new PlaneClient({
      baseURL: workspaceConnection.targetHostname,
      apiToken: planeCredentials.target_access_token!,
    });

    let issue: ExIssue | null = null;

    const ghService = createGithubService(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, data.installationId.toString());

    const ghIssue = await ghService.getIssue(data.owner, data.repositoryName, Number(data.issueNumber));
    // Get the issue associated with the issue number and id

    try {
      issue = await planeClient.issue.getIssueWithExternalId(
        entityConnection.workspaceSlug,
        entityConnection.projectId,
        data.issueNumber.toString(),
        "GITHUB"
      );
    } catch (error) {
      logger.info("Issue not found in Plane, will create a new one");
    }

    const planeUsers = await planeClient.users.list(entityConnection.workspaceSlug, entityConnection.projectId);

    const userMap: Record<string, string> = Object.fromEntries(
      workspaceConnection.config.userMap.map((obj) => [obj.githubUser.login, obj.planeUser.id])
    );

    const planeIssue = transformGitHubIssue(
      ghIssue.data as WebhookGitHubIssue,
      data.repositoryName,
      userMap,
      entityConnection.workspaceSlug,
      planeUsers,
      issue ? true : false
    );

    const states = (await planeClient.state.list(entityConnection.workspaceSlug, entityConnection.projectId)).results;
    const users = await planeClient.users.list(entityConnection.workspaceSlug, entityConnection.projectId);

    if (planeIssue.state) {
      const state = states.find((s) => s.name === planeIssue.state);
      if (state) {
        planeIssue.state = state.id;
      }
    }

    if (planeIssue.labels) {
      const labels = (await planeClient.label.list(entityConnection.workspaceSlug, entityConnection.projectId)).results;

      if (
        ghIssue.data.labels &&
        Array.isArray(ghIssue.data.labels) &&
        ghIssue.data.labels.every((label) => typeof label !== "string")
      ) {
        const labelsToCreate = ghIssue.data.labels.filter((label) => {
          return !labels.find((l) => l.name === label.name);
        });

        const labelPromises = labelsToCreate.map(async (label) => {
          const createdLabel = await planeClient.label.create(
            entityConnection.workspaceSlug,
            entityConnection.projectId,
            {
              name: label.name,
              color: `#${label.color}`,
              external_id: label.id ? label.id.toString() : label.name,
              external_source: "GITHUB",
            }
          );

          return createdLabel;
        });

        const createdLabels = await Promise.all(labelPromises);
        labels.push(...createdLabels);
      }

      planeIssue.labels = planeIssue.labels
        .map((label) => {
          const l = labels.find((l) => l.name === label);
          if (l) {
            return l.id;
          }
        })
        .filter((l) => l !== undefined) as string[];
    }

    if (planeIssue.assignees) {
      planeIssue.assignees = planeIssue.assignees
        .map((assignee) => {
          const user = users.find((u) => u.id === assignee);
          if (user) {
            return user.id;
          }
        })
        .filter((u) => u !== undefined) as string[];
    }

    if (planeIssue.created_by) {
      const user = users.find((u) => u.display_name === planeIssue.created_by);
      if (user) {
        planeIssue.created_by = user.id;
      }
    }

    if (issue) {
      await planeClient.issue.update(entityConnection.workspaceSlug, entityConnection.projectId, issue.id, planeIssue);
      await store.set(`silo:issue:${issue.id}`, "true", 7);
    } else {
      const createdIssue = await planeClient.issue.create(
        entityConnection.workspaceSlug,
        entityConnection.projectId,
        planeIssue
      );

      // Get the project for the issue
      const project = await planeClient.project.getProject(entityConnection.workspaceSlug, entityConnection.projectId);

      const comment = `Synced Issue with [Plane](${env.APP_BASE_URL}) Workspace 🔄\n\n[${project.identifier}-${createdIssue.sequence_id} ${createdIssue.name}](${env.APP_BASE_URL}/${entityConnection.workspaceSlug}/projects/${entityConnection.projectId}/issues/${createdIssue.id})`;
      await ghService.createIssueComment(data.owner, data.repositoryName, Number(data.issueNumber), comment);

      // If the issue is created, make a comment on github about the same
      await store.set(`silo:issue:${createdIssue.id}`, "true", 7);
    }
  } catch (error) {
    logger.error("Error syncing issue with Plane");
  }
};
