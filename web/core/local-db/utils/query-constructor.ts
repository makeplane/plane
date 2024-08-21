import { persistence } from "../storage.sqlite";
import { GROUP_BY_MAP, ARRAY_FIELDS, PRIORITY_MAP } from "./constants";
import { getOrderByFragment, translateQueryParams } from "./query.utils";
import { wrapDateTime, filterConstructor } from "./utils";
const SPECIAL_ORDER_BY = [
  "labels__name",
  "-labels__name",
  "assignee__name",
  "-assignee__name",
  "module__name",
  "-module__name",
];
export const issueFilterQueryConstructor = (workspaceSlug: string, projectId: string, queries: any) => {
  const { order_by, cursor, per_page, group_by, sub_group_by, ...otherProps } = translateQueryParams(queries);
  const orderByString = getOrderByFragment(order_by);
  const [pageSize, page, offset] = cursor.split(":");

  const filterString = filterConstructor(otherProps);
  const subFilterString = subFilterConstructor(queries);

  let sql = "";
  if (group_by) {
    console.log("###", group_by);

    const translatedGroupBy = GROUP_BY_MAP[group_by];
    const translatedSubGroupBy = GROUP_BY_MAP[sub_group_by];
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
        ${filterString} ${subFilterString}
        ) rs
      JOIN issues i ON rs.issue_id = i.id
      WHERE rs.rank <= ${per_page};`;
    } else {
      sql = `
        SELECT j.* FROM (
          SELECT 	i.*,i.${translatedGroupBy} as group_id, 
          -- i.${translatedSubGroupBy} as sub_group_id,
                  ROW_NUMBER() OVER (PARTITION BY i.${translatedGroupBy} 
                  -- , i.${translatedSubGroupBy} 
                  ${orderByString} ) as rank, 
                  COUNT(*) OVER (PARTITION by i.${translatedGroupBy}) as total_issues 

                  FROM issues AS i LEFT JOIN issue_meta as im ON i.id = im.issue_id 
                 WHERE i.project_id = '${projectId}'  -- Project ID
        ${filterString}
        GROUP BY i.id
        ) AS j  WHERE rank <= ${per_page};

      `;
    }

    console.log("####", sql);
    return sql;
  }

  // sql = `SELECT * FROM issues i LEFT JOIN issue_meta im ON i.id = im.issue_id WHERE 1=1 AND project_id='${projectId}' `;

  // sql += filterString;

  // sql += ` group by i.id`;
  // sql += orderByString;

  // // Add offset and paging to query
  // sql += ` LIMIT  ${pageSize} OFFSET ${offset * 1 + page * pageSize};`;

  // console.log("$$$", sql);
  // return sql;

  if (order_by && SPECIAL_ORDER_BY.includes(order_by)) {
    const name = order_by.replace("-", "");
    sql = `SELECT i.*,im.*, s.name as ${name} FROM issues i LEFT JOIN issue_meta im ON i.id = im.issue_id LEFT JOIN labels s ON s.id = im.value `;
  } else {
    sql = `SELECT * FROM issues i LEFT JOIN issue_meta im ON i.id = im.issue_id `;
  }

  sql += ` WHERE 1=1 AND i.project_id='${projectId}' `;

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
  const { group_by, order_by, ...otherProps } = queries;
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

  persistence.db.exec({
    sql: `insert into issues(${keys}) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    bind: values,
  });
  arrayFields.forEach((field) => {
    const values = issue[field];
    if (values) {
      values.forEach((val: any) => {
        persistence.db.exec({
          sql: `insert into issue_meta(issue_id,key,value) values (?,?,?)`,
          bind: [issue_id, field, val],
        });
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
