import { persistence } from "../storage.sqlite";
import { PRIORITY_MAP } from "./constants";
import {
  getFilteredRowsForGrouping,
  getMetaKeys,
  getOrderByFragment,
  singleFilterConstructor,
  translateQueryParams,
} from "./query.utils";
export const SPECIAL_ORDER_BY = [
  "labels__name",
  "-labels__name",
  "assignee__name",
  "-assignee__name",
  "module__name",
  "-module__name",
];
export const issueFilterQueryConstructor = (workspaceSlug: string, projectId: string, queries: any) => {
  const { order_by, cursor, per_page, group_by, sub_group_by, sub_issue, ...otherProps } =
    translateQueryParams(queries);
  const orderByString = getOrderByFragment(order_by);
  const [pageSize, page, offset] = cursor.split(":");

  let sql = "";

  if (sub_group_by) {
    sql = getFilteredRowsForGrouping(projectId, queries);
    sql += `, rn AS ( SELECT fi.*,
    RANK() OVER (PARTITION BY group_id, sub_group_id ${orderByString}) as rank,
    COUNT(*) OVER (PARTITION by group_id, sub_group_id) as total_issues from fi) SELECT * FROM rn
    WHERE rank <= ${per_page}

    `;

    console.log("###", sql);

    return sql;
  }
  if (group_by) {
    sql = getFilteredRowsForGrouping(projectId, queries);
    sql += `, rn AS ( SELECT fi.*,
    RANK() OVER (PARTITION BY group_id ${orderByString}) as rank,
    COUNT(*) OVER (PARTITION by group_id) as total_issues from fi) SELECT * FROM rn
    WHERE rank <= ${per_page}
    `;

    console.log("###", sql);

    return sql;
  }

  const filterJoinFields = getMetaKeys(queries);
  if (order_by && SPECIAL_ORDER_BY.includes(order_by)) {
    const name = order_by.replace("-", "");
    sql = `SELECT i.*, s.name as ${name} from issues i`;
  } else {
    sql = `SELECT * from issues i`;
  }
  filterJoinFields.forEach((field: string) => {
    const value = otherProps[field] || "";
    sql += ` INNER JOIN issue_meta ${field} ON i.id = ${field}.issue_id AND ${field}.key = '${field}' AND ${field}.value  IN ('${value.split(",").join("','")}')
    `;
  });

  if (order_by && SPECIAL_ORDER_BY.includes(order_by)) {
    sql += ` 
    LEFT JOIN issue_meta label_ids ON i.id = label_ids.issue_id AND label_ids.key = 'label_ids'
    INNER JOIN labels s ON s.id = label_ids.value`;
  }
  sql += ` WHERE i.project_id = '${projectId}'    ${singleFilterConstructor(otherProps)} group by i.id`;
  sql += orderByString;

  // Add offset and paging to query
  sql += ` LIMIT  ${pageSize} OFFSET ${offset * 1 + page * pageSize};`;

  console.log("$$$", sql);
  return sql;
};

export const issueFilterCountQueryConstructor = (workspaceSlug: string, projectId: string, queries: any) => {
  // Remove group by from the query to fallback to non group query
  const { group_by, sub_group_by, order_by, ...otherProps } = queries;
  let sql = issueFilterQueryConstructor(workspaceSlug, projectId, otherProps);

  sql = sql.replace("SELECT *", "SELECT COUNT(DISTINCT i.id) as total_count");
  // Remove everything after group by i.id
  sql = `${sql.split("group by i.id")[0]};`;
  console.log("### COUNT", sql);
  return sql;
};

const arrayFields = ["label_ids", "assignee_ids", "module_ids"];

export const stageIssueInserts = (issue: any) => {
  const issue_id = issue.id;
  issue.priority_proxy = PRIORITY_MAP[issue.priority as keyof typeof PRIORITY_MAP];
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

  persistence.db.exec({
    sql: `INSERT OR REPLACE  into issues(${keys}) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    bind: values,
  });

  persistence.db.exec({
    sql: `DELETE from issue_meta where issue_id='${issue_id}'`,
  });

  arrayFields.forEach((field) => {
    const values = issue[field];
    if (values && values.length) {
      values.forEach((val: any) => {
        persistence.db.exec({
          sql: `INSERT OR REPLACE  into issue_meta(issue_id,key,value) values (?,?,?) `,
          bind: [issue_id, field, val],
        });
      });
    } else {
      // Added for empty fields?
      persistence.db.exec({
        sql: `INSERT OR REPLACE  into issue_meta(issue_id,key,value) values (?,?,?) `,
        bind: [issue_id, field, ""],
      });
    }
  });
};
