import { runQuery } from "./query-executor";

export const getProjectIds = async () => {
  const q = `select project_id from states where project_id is not null group by project_id`;
  return await runQuery(q);
};

export const getSubIssues = async (issueId: string) => {
  const q = `select * from issues where parent_id = '${issueId}'`;
  return await runQuery(q);
};

export const getSubIssueDistribution = async (issueId: string) => {
  const q = `select s.'group', group_concat(i.id) as issues from issues i left join states s on s.id = i.state_id  where i.parent_id = '${issueId}' group by s.'group'`;

  const result = await runQuery(q);
  if (!result.length) {
    return {};
  }
  return result.reduce((acc: Record<string, string[]>, item: { group: string; issues: string }) => {
    acc[item.group] = item.issues.split(",");
    return acc;
  }, {});
};

export const getSubIssuesWithDistribution = async (issueId: string) => {
  const promises = [getSubIssues(issueId), getSubIssueDistribution(issueId)];
  const [sub_issues, state_distribution] = await Promise.all(promises);
  return { sub_issues, state_distribution };
};
