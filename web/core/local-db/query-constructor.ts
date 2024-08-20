import { sq } from "date-fns/locale";
import { ARRAY_FIELDS, GROUP_BY_MAP, PRIORITY_MAP } from "./constants";
import { SQL } from "./sqlite";
import { filterConstructor, wrapDateTime } from "./utils";

export const issueFilterQueryConstructor = (workspaceSlug: string, projectId: string, queries: any) => {
  const { order_by, cursor, per_page, labels, sub_issue, assignees, state, cycle, group_by, module, ...otherProps } =
    queries;

  if (state) otherProps.state_id = state;
  if (cycle) otherProps.cycle_id = cycle;
  if (module) otherProps.module_ids = module;
  if (labels) otherProps.label_ids = labels;
  if (assignees) otherProps.assignee_ids = assignees;

  let orderByString = "";
  if (order_by) {
    //if order_by starts with "-" then sort in descending order
    if (order_by.startsWith("-")) {
      orderByString += ` ORDER BY ${wrapDateTime(order_by.slice(1))} DESC, created_at DESC`;
    } else {
      orderByString += ` ORDER BY ${wrapDateTime(order_by)} ASC, created_at DESC`;
    }
  }
  const [pageSize, page, offset] = cursor.split(":");
  const filterString = filterConstructor(otherProps);

  let sql = "";
  if (group_by) {
    console.log("###", group_by);

    const translatedGroupBy = GROUP_BY_MAP[group_by];
    // Check if group by is by array field
    if (ARRAY_FIELDS.includes(translatedGroupBy)) {
      sql = `
      SELECT i.*, rs.group_id, rs.total_issues
        FROM (
            SELECT im.issue_id,
            im.value AS group_id,
            ROW_NUMBER() OVER (
               PARTITION BY im.value
               ${orderByString}
           ) AS rank,
           COUNT(*) OVER (PARTITION BY im.value) AS total_issues
        FROM issue_meta im
        JOIN issues i ON im.issue_id = i.id
        WHERE im.key = '${translatedGroupBy}'  -- param for group
        AND i.project_id = '${projectId}'  -- Project ID
        ${filterString}
        ) rs
      JOIN issues i ON rs.issue_id = i.id
      WHERE rs.rank <= ${per_page};`;
    } else {
      sql = `
      SELECT *
        FROM (
            SELECT i.*,
            i.${translatedGroupBy} AS group_id,   -- param for group
            COUNT(*) OVER (PARTITION BY i.${translatedGroupBy}) AS total_issues,
            ROW_NUMBER() OVER (PARTITION BY i.${translatedGroupBy} ${orderByString}) AS rank FROM issues i
      WHERE i.project_id = '${projectId}'   ${filterString}
      ) ranked_issues
      WHERE rank <= ${per_page};`;
    }

    console.log("####", sql);
    return sql;
  }

  sql = `SELECT * FROM issues i LEFT JOIN issue_meta im ON i.id = im.issue_id WHERE 1=1 AND project_id='${projectId}' `;

  sql += filterString;

  sql += ` group by i.id`;
  sql += orderByString;

  // Add offset and paging to query
  sql += ` LIMIT  ${pageSize} OFFSET ${offset * 1 + page * pageSize};`;

  console.log("$$$", sql);
  return sql;
};

export const issueFilterCountQueryConstructor = (workspaceSlug: string, projectId: string, queries: any) => {
  // Remove group by from the query to fallback to non group query
  const { group_by, ...otherProps } = queries;
  let sql = issueFilterQueryConstructor(workspaceSlug, projectId, otherProps);

  sql = sql.replace("SELECT *", "SELECT COUNT(DISTINCT i.id) as total_count");
  // Remove everything after group by i.id
  sql = `${sql.split("group by i.id")[0]};`;

  return sql;
};

const arrayFields = ["label_ids", "assignee_ids", "module_ids"];

export const stageIssueInserts = (issue: any) => {
  const issue_id = issue.id;
  issue.priority_proxy = PRIORITY_MAP[issue.priority];
  const keys = Object.keys(issue).join(",");

  const values = Object.values(issue).map((val) => {
    if (val === null) {
      return "";
    }
    if (typeof val === "object") {
      return JSON.stringify(val);
    }
    return val;
  }); // Will fail when the values have a comma

  SQL.db.exec({
    sql: `insert into issues(${keys}) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    bind: values,
  });
  arrayFields.forEach((field) => {
    const values = issue[field];
    if (values) {
      values.forEach((val: any) => {
        SQL.db.exec({
          sql: `insert into issue_meta(issue_id,key,value) values (?,?,?)`,
          bind: [issue_id, field, val],
        });
      });
    }
  });
};
