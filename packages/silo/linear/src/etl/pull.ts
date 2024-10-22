import { LinearService } from "@/services";
import { Issue, IssueLabel, User } from "@linear/sdk";
import { LinearComment, LinearCycle, LinearIssueAttachment } from "@/types";

export async function pullUsers(
  client: LinearService,
  teamId: string,
): Promise<User[]> {
  const members = await client.getTeamMembers(teamId);
  return members.nodes;
}

export async function pullLabels(client: LinearService): Promise<IssueLabel[]> {
  const labels = await client.getIssueLabels();
  return labels.nodes;
}

export async function pullIssues(
  client: LinearService,
  teamId: string,
): Promise<Issue[]> {
  const issues: Issue[] = [];
  let cursor: string | undefined;

  do {
    const response = await client.getTeamIssues(teamId, cursor);
    issues.push(...response.nodes);
    cursor = response.pageInfo.endCursor;
  } while (cursor);

  return issues;
}

export async function pullAttachments(
  issues: Issue[],
  client: LinearService,
): Promise<LinearIssueAttachment[]> {
  const issueIds = issues.map((issue) => issue.id);
  const attachments = await client.getIssuesAttachments(issueIds, client);
  return attachments;
}

export async function pullComments(
  issues: Issue[],
  client: LinearService,
): Promise<LinearComment[]> {
  const issueIds = issues.map((issue) => issue.id);
  const comments = await client.getIssuesComments(issueIds);
  return comments;
}

export async function pullCycles(
  client: LinearService,
  teamId: string,
): Promise<LinearCycle[]> {
  const cycles: LinearCycle[] = [];
  try {
    const teamCycles = await client.getTeamCycles(teamId);
    for (const cycle of teamCycles.nodes) {
      const cycleIssues = await client.linearClient.issues({
        filter: {
          cycle: { id: { eq: cycle.id } },
          team: { id: { eq: teamId } },
        },
      });
      cycles.push({ cycle, issues: cycleIssues.nodes });
    }
  } catch (e) {
    throw Error(`Could not fetch cycles, something went wrong`);
  }
  return cycles;
}

// export const pullCommentsForIssue = async (
//   issue: Issue,
//   client: LinearService,
// ): Promise<LinearComment[]> => {
//   const comments: LinearComment[] = [];
//   let cursor: string | undefined;
//
//   do {
//     const response = await client.getIssuesComments(issues);
//     const linearComment = response.nodes.map((comment): LinearComment => {
//       return {
//         ...comment,
//         issue_id: issue.id,
//       } as unknown as LinearComment;
//     });
//     comments.push(...linearComment);
//     cursor = response.pageInfo.endCursor;
//   } while (cursor);
//
//   return comments;
// };
//
// export const pullCommentsInBatches = async (
//   issues: Issue[],
//   batchSize: number,
//   client: LinearService,
// ): Promise<LinearComment[]> => {
//   const comments: LinearComment[] = [];
//   for (let i = 0; i < issues.length; i += batchSize) {
//     const batch = issues.slice(i, i + batchSize);
//     const batchComments = await Promise.all(
//       batch.map((issue) => pullCommentsForIssue(issue, client)),
//     );
//     comments.push(...batchComments.flat());
//   }
//   return comments;
// };
