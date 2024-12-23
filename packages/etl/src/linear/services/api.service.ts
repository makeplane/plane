import {
  Comment,
  Issue,
  LinearClient,
  LinearError,
  Organization,
  RatelimitedLinearError,
  Team,
  WorkflowState,
} from "@linear/sdk";
import { LinearComment } from "..";

export type LinearProps =
  | {
      isPAT: false;
      accessToken: string;
    }
  | {
      isPAT: true;
      apiKey: string;
    };

// Utility function for sleep
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class LinearService {
  private linearClient: LinearClient;
  private rateLimitDelay: number = 1000; // 1 second delay between requests
  // eslint-disable-next-line no-undef
  private teamCache: Map<string, Team> = new Map();

  constructor(props: LinearProps) {
    if (props.isPAT) {
      this.linearClient = new LinearClient({
        apiKey: props.apiKey,
      });
    } else {
      this.linearClient = new LinearClient({
        accessToken: props.accessToken,
      });
    }
  }

  private async rateLimitedRequest<T>(request: () => Promise<T>): Promise<T> {
    while (true) {
      try {
        await sleep(this.rateLimitDelay);
        return await request();
      } catch (error) {
        error = error as LinearError;
        // @ts-ignore
        if (error instanceof RatelimitedLinearError) {
          await sleep(60000); // Wait for 1 minute before retrying
        } else {
          throw error;
        }
      }
    }
  }

  async organization(): Promise<Organization> {
    return await this.rateLimitedRequest(() => this.linearClient.organization);
  }

  async getCurrentUser() {
    return await this.rateLimitedRequest(() => this.linearClient.viewer);
  }

  async getNumberOfIssues(teamId: string) {
    const issues = await this.rateLimitedRequest(() =>
      this.linearClient.issues({
        filter: {
          team: { id: { eq: teamId } },
        },
      })
    );
    return issues.nodes.length;
  }

  async getCycleIssues(cycleId: string, teamId: string) {
    const cycleIssues = await this.linearClient.issues({
      filter: {
        cycle: { id: { eq: cycleId } },
        team: { id: { eq: teamId } },
      },
    });

    return cycleIssues.nodes;
  }

  async getIssueLabels() {
    return await this.rateLimitedRequest(() => this.linearClient.issueLabels());
  }

  async getTeams() {
    return await this.rateLimitedRequest(() => this.linearClient.teams());
  }

  async getTeamsWithoutPagination() {
    const teams: Team[] = [];
    let nextPaginateUUID: string | undefined = undefined;

    while (true) {
      const response = await this.rateLimitedRequest(() =>
        this.linearClient.teams({
          after: nextPaginateUUID,
        })
      );
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

  async getTeam(teamId: string): Promise<Team> {
    if (this.teamCache.has(teamId)) {
      return this.teamCache.get(teamId)!;
    }
    const team = await this.rateLimitedRequest(() => this.linearClient.team(teamId));
    this.teamCache.set(teamId, team);
    return team;
  }

  async getTeamStatuses(teamId: string) {
    const team = await this.getTeam(teamId);
    return await this.rateLimitedRequest(() => team.states());
  }

  async getTeamStatusesWithoutPagination(teamId: string) {
    const team = await this.getTeam(teamId);
    const teamStates: WorkflowState[] = [];
    let nextPaginateUUID: string | undefined = undefined;

    while (true) {
      const response = await this.rateLimitedRequest(() =>
        team.states({
          after: nextPaginateUUID,
        })
      );
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
    const team = await this.getTeam(teamId);
    return await this.rateLimitedRequest(() => team.projects());
  }

  async getTeamIssues(teamId: string, cursor?: string) {
    return await this.rateLimitedRequest(() =>
      this.linearClient.issues({
        first: 50,
        after: cursor,
        filter: {
          team: { id: { eq: teamId } },
        },
      })
    );
  }

  async getProjectIssues(projectId: string, cursor?: string) {
    return await this.rateLimitedRequest(() =>
      this.linearClient.issues({
        first: 50,
        after: cursor,
        filter: {
          project: { id: { eq: projectId } },
        },
      })
    );
  }

  async getTeamMembers(teamId: string) {
    const team = await this.getTeam(teamId);
    return await this.rateLimitedRequest(() => team.members());
  }

  async getIssuesAttachments(issue: Issue): Promise<any> {
    return await this.rateLimitedRequest(() => issue.attachments());
  }

  async getIssuesComments(issues: string[]): Promise<LinearComment[]> {
    const comments = await this.rateLimitedRequest(() =>
      this.linearClient.comments({
        filter: {
          issue: { id: { in: issues } },
        },
      })
    );

    const linearCommentPromises = comments.nodes.map(async (comment): Promise<LinearComment> => {
      const brokenIds = this.breakAndGetIds(comment);
      return {
        ...comment,
        issue_id: brokenIds?.issue_id,
        user_id: brokenIds?.user_id,
      } as LinearComment;
    });

    const linearComments = await Promise.all(linearCommentPromises);
    return linearComments;
  }

  async getTeamCycles(teamId: string) {
    const team = await this.getTeam(teamId);
    return await this.rateLimitedRequest(() => team.cycles());
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

  private breakAndGetIds(comment: Comment) {
    if (
      // @ts-ignore
      comment._issue &&
      // @ts-ignore
      comment._issue.id &&
      // @ts-ignore
      comment._user &&
      // @ts-ignore
      comment._user.id
    ) {
      return {
        // @ts-ignore
        issue_id: comment._issue.id,

        // @ts-ignore
        user_id: comment._user.id,
      };
    }
  }
}

export default LinearService;
