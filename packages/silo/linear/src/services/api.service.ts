import { Comment, LinearClient, Team, WorkflowState } from "@linear/sdk";
import { LinearComment, LinearIssueAttachment } from "..";

export type LinearProps = {
  accessToken: string;
};

export class LinearService {
  linearClient: LinearClient;

  constructor(props: LinearProps) {
    this.linearClient = new LinearClient({
      accessToken: props.accessToken,
    });
  }

  async getCurrentUser() {
    return await this.linearClient.viewer;
  }

  async getNumberOfIssues(teamId: string) {
    const issues = await this.linearClient.issues({
      filter: {
        team: { id: { eq: teamId } },
      },
    });
    return issues.nodes.length;
  }

  async getIssueLabels() {
    return await this.linearClient.issueLabels();
  }

  async getTeams() {
    return await this.linearClient.teams();
  }

  async getTeamsWithoutPagination() {
    const teams: Team[] = [];
    let nextPaginateUUID: string | undefined = undefined;

    while (true) {
      const response = await this.linearClient.teams({
        after: nextPaginateUUID,
      });
      if (response.nodes) {
        teams.push(...response.nodes);
      }
      if (!response.pageInfo.hasNextPage) {
        break;
      }
      nextPaginateUUID = response.pageInfo.endCursor;
    }

    return teams;
  }

  async getTeamStatuses(teamId: string) {
    const team = await this.linearClient.team(teamId);
    return await team.states();
  }

  async getTeamStatusesWithoutPagination(teamId: string) {
    const team = await this.linearClient.team(teamId);
    const teamStates: WorkflowState[] = [];
    let nextPaginateUUID: string | undefined = undefined;

    while (true) {
      const response = await team.states({
        after: nextPaginateUUID,
      });
      if (response.nodes) {
        teamStates.push(...response.nodes);
      }
      if (!response.pageInfo.hasNextPage) {
        break;
      }
      nextPaginateUUID = response.pageInfo.endCursor;
    }

    return teamStates;
  }

  async getTeamProjects(teamId: string) {
    const team = await this.linearClient.team(teamId);
    return await team.projects();
  }

  async getTeamIssues(teamId: string, cursor?: string) {
    return await this.linearClient.issues({
      first: 50,
      after: cursor,
      filter: {
        team: { id: { eq: teamId } },
      },
    });
  }

  async getProjectIssues(projectId: string, cursor?: string) {
    return await this.linearClient.issues({
      first: 50,
      after: cursor,
      filter: {
        project: { id: { eq: projectId } },
      },
    });
  }

  async getTeamMembers(teamId: string) {
    const team = await this.linearClient.team(teamId);
    return await team.members();
  }

  async getIssuesAttachments(
    issues: string[],
    client: LinearService
  ): Promise<any> {
    const attachments = await this.linearClient.attachments({
      filter: {
        title: { neq: "Original issue in Jira" },
      },
    });

    console.log(attachments);
  }

  async getIssuesComments(issues: string[]): Promise<LinearComment[]> {
    const comments = await this.linearClient.comments({
      filter: {
        issue: { id: { in: issues } },
      },
    });

    const linearCommentPromises = comments.nodes.map(
      async (comment): Promise<LinearComment> => {
        const brokenIds = this.breakAndGetIds(comment);
        return {
          ...comment,
          issue_id: brokenIds.issue_id,
          user_id: brokenIds.user_id,
        } as LinearComment;
      }
    );

    const linearComments = (await Promise.all(
      linearCommentPromises
    )) as LinearComment[];

    return linearComments;
  }

  async getTeamCycles(teamId: string) {
    const team = await this.linearClient.team(teamId);
    return await team.cycles();
  }

  async getIssuePriorities() {
    // Linear has fixed priorities: 0 (None), 1 (Urgent), 2 (High), 3 (Medium), 4 (Low)
    return [
      { id: 0, name: "None" },
      { id: 1, name: "Urgent" },
      { id: 2, name: "High" },
      { id: 3, name: "Medium" },
      { id: 4, name: "Low" },
    ];
  }

  breakAndGetIds(comment: Comment) {
    return {
      // @ts-ignore
      issue_id: comment._issue.id,
      // @ts-ignore
      user_id: comment._user.id,
    };
  }
}

export default LinearService;
