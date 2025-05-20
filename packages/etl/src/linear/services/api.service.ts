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

  async getProject(projectId: string) {
    return await this.rateLimitedRequest(() => this.linearClient.project(projectId));
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

  async getIssueByIdentifier(identifier: string) {
    const parts = identifier.split('-');
    if (parts.length !== 2) {
      throw new Error(`Invalid issue identifier format: ${identifier}. Expected format: PRJ-123`);
    }

    const [projectIdentifier, sequenceNumber] = parts;

    const issues = await this.linearClient.issues({
      filter: {
        team: { key: { eq: projectIdentifier } },
        number: { eq: parseInt(sequenceNumber, 10) }
      },
    });

    // Return the first matching issue or null if not found
    if (issues.nodes.length === 0) {
      return null;
    }

    return issues.nodes[0];
  }

  async getDocuments(teamId: string) {
    const team = await this.getTeam(teamId);
    const projects = await team.projects();

    const docs = await this.linearClient.documents({
      filter: {
        project: { id: { in: projects.nodes.map((project) => project.id) } },
      },
    });

    return docs.nodes;
  }

  private breakAndGetIds(comment: Comment) {
    if (
      // @ts-expect-error
      comment._issue &&
      // @ts-expect-error
      comment._issue.id &&
      // @ts-expect-error
      comment._user &&
      // @ts-expect-error
      comment._user.id
    ) {
      return {
        // @ts-expect-error
        issue_id: comment._issue.id,

        // @ts-expect-error
        user_id: comment._user.id,
      };
    }
  }

  /**
   * Get counts for various Linear entities within a team
   * @param teamId The Linear team ID
   * @returns Record containing count for each entity type
   */
  async getLinearDataSummary(teamId: string): Promise<Record<string, number>> {
    // Define the response type for the GraphQL query - we keep this for type safety
    type TeamEntitiesResponse = {
      team: {
        issueCount: number;
        states: {
          nodes: Array<{ id: string }>;
        };
        cycles: {
          nodes: Array<{ id: string }>;
        };
        labels: {
          nodes: Array<{ id: string }>;
        };
        projects: {
          nodes: Array<{
            id: string;
            documents?: {
              nodes: Array<{ id: string }>;
            };
          }>;
        };
      };
    };

    // Get counts for all entities in one query
    const query = `
    query TeamEntityCounts {
      team(id: "${teamId}") {
        issueCount
        states {
          nodes {
            id
          }
        }
        cycles {
          nodes {
            id
          }
        }
        labels {
          nodes {
            id
          }
        }
        projects {
          nodes {
            id
            documents {
              nodes {
                id
              }
            }
          }
        }
      }
    }
    `;

    // Execute the query with rate limiting and proper type annotation
    const response = await this.rateLimitedRequest(() =>
      this.linearClient.client.request<TeamEntitiesResponse, any>(query)
    );

    // Initialize the counts object
    const counts: Record<string, number> = {};

    // Define entity paths and their corresponding names in the result
    const entityMappings = [
      { path: 'issueCount', name: 'issues' },
      { path: 'states.nodes', name: 'states' },
      { path: 'cycles.nodes', name: 'cycles' },
      { path: 'labels.nodes', name: 'labels' },
      { path: 'projects.nodes', name: 'projects' }
    ];

    // Process each entity mapping
    entityMappings.forEach(mapping => {
      // Get the value at the path
      const pathParts = mapping.path.split('.');
      let value: any = response.team;

      for (const part of pathParts) {
        if (value && value[part] !== undefined) {
          value = value[part];
        } else {
          value = null;
          break;
        }
      }

      // Count based on the type of value
      if (typeof value === 'number') {
        counts[mapping.name] = value;
      } else if (Array.isArray(value)) {
        counts[mapping.name] = value.length;
      } else {
        counts[mapping.name] = 0;
      }
    });

    // Special handling for documents (nested count across projects)
    counts.documents = 0;
    if (response.team?.projects?.nodes) {
      response.team.projects.nodes.forEach(project => {
        if (project.documents?.nodes) {
          counts.documents += project.documents.nodes.length;
        }
      });
    }

    return counts;
  }
}

export default LinearService;
