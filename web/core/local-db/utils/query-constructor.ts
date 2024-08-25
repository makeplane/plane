import { persistence } from "../storage.sqlite";
import { ARRAY_FIELDS, GROUP_BY_MAP, PRIORITY_MAP } from "./constants";
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

  persistence.db.exec({
    sql: `INSERT OR REPLACE  into issues(${keys}) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    bind: values,
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
      persistence.db.exec({
        sql: `INSERT OR REPLACE  into issue_meta(issue_id,key,value) values (?,?,?) `,
        bind: [issue_id, field, ""],
      });
    }
  });
};

const subFilterConstructor = (queries: any) => {
  // return "";
  let { group_by, sub_group_by } = queries;
  group_by = GROUP_BY_MAP[group_by];
  sub_group_by = GROUP_BY_MAP[sub_group_by];
  const fields = new Set();
  if (ARRAY_FIELDS.includes(sub_group_by)) {
    fields.add(sub_group_by);
  }
  if (ARRAY_FIELDS.includes(group_by)) {
    fields.add(group_by);
  }

  ARRAY_FIELDS.forEach((field: string) => {
    if (queries[field]) {
      fields.add(field);
    }
  });

  if (fields.size === 0) {
    return "";
  }

  let sql = "";

  sql += 'AND im.key IN ("' + Array.from(fields).join('","') + '")';

  return sql;
};
