import { EIssueGroupBYServerToProperty } from "@plane/constants";
import { wrapDateTime } from "./utils";
import { TIssue } from "@plane/types";

export const issueFilterQueryConstructor = (queries: any) => {
  const { order_by, cursor, per_page, labels, sub_issue, assignees, state, cycle, group_by, module, ...otherProps } =
    queries;

  if (state) otherProps.state_id = state;
  if (cycle) otherProps.cycle_id = cycle;
  if (module) otherProps.module_ids = module;
  if (labels) otherProps.label_ids = labels;
  if (assignees) otherProps.assignee_ids = assignees;

  const [pageSize, page, offset] = cursor.split(":");

  let orderBY = "";

  if (order_by) {
    //if order_by starts with "-" then sort in descending order
    if (order_by.startsWith("-")) {
      orderBY += ` ORDER BY ${wrapDateTime(order_by.slice(1))} DESC`;
    } else {
      orderBY += ` ORDER BY ${wrapDateTime(order_by)} ASC`;
    }
  }

  const groupByProperty = EIssueGroupBYServerToProperty[group_by as typeof EIssueGroupBYServerToProperty];
  console.log(group_by, groupByProperty, page);

  const arrayFields = ["label_ids", "assignee_ids", "module_ids"];
  let sql = `SELECT * FROM issues i LEFT JOIN issue_meta im ON i.id = im.issue_id WHERE 1=1 `;
  if (groupByProperty && page === "0") {
    sql = `SELECT im.issue_id,
      im.value AS group_id,
      RANK() OVER (
          PARTITION BY im.value
          ${orderBY}
      ) AS rank,
    COUNT(*) OVER (PARTITION BY im.value) AS total_issues
    FROM issue_meta im
    JOIN issues i ON im.issue_id = i.id
    WHERE im.key = '${groupByProperty}'`;
  }

  const keys = Object.keys(otherProps);

  keys.forEach((key) => {
    const value = otherProps[key] ? otherProps[key].split(",") : "";
    if (!value) return;
    if (arrayFields.includes(key)) {
      sql += ` AND key='${key}' AND value IN ('${value.join("','")}')`;
    } else {
      sql += ` AND ${key} in ('${value.join("','")}')`;
    }
  });

  if (groupByProperty && page === "0")
    sql = `SELECT i.*, rs.group_id, rs.total_issues
  FROM (
    ${sql} 
  ) rs
  JOIN issues i ON rs.issue_id = i.id
  WHERE rs.rank <= ${pageSize}`;

  // sql += ` group by i.id`;

  // Add offset and paging to query
  //sql += ` LIMIT  ${pageSize} OFFSET ${offset * 1 + page * pageSize};`;

  console.log("$$$", sql);
  return sql;
};

export const issueFilterCountQueryConstructor = (queries: any) => {
  let sql = issueFilterQueryConstructor(queries);

  // sql = sql.replace("SELECT *", "SELECT COUNT(DISTINCT i.id) as total_count");
  // // Remove everything after group by i.id
  // sql = `${sql.split("group by i.id")[0]};`;

  console.log(sql);
  return sql;
};
