import {
  getFilteredRowsForGrouping,
  getIssueFieldsFragment,
  getMetaKeys,
  getOrderByFragment,
  singleFilterConstructor,
  translateQueryParams,
} from "./query.utils";
import { log } from "./utils";
export const SPECIAL_ORDER_BY = {
  labels__name: "labels",
  "-labels__name": "labels",
  assignees__first_name: "members",
  "-assignees__first_name": "members",
  issue_module__module__name: "modules",
  "-issue_module__module__name": "modules",
  issue_cycle__cycle__name: "cycles",
  "-issue_cycle__cycle__name": "cycles",
  state__name: "states",
  "-state__name": "states",
};
export const issueFilterQueryConstructor = (workspaceSlug: string, projectId: string, queries: any) => {
  const {
    cursor,
    per_page,
    group_by,
    sub_group_by,
    order_by = "created_at",
    ...otherProps
  } = translateQueryParams(queries);

  const [pageSize, page, offset] = cursor.split(":");

  let sql = "";

  const fieldsFragment = getIssueFieldsFragment();

  if (sub_group_by) {
    const orderByString = getOrderByFragment(order_by);
    sql = getFilteredRowsForGrouping(projectId, queries);
    sql += `, ranked_issues AS ( SELECT fi.*,
    ROW_NUMBER() OVER (PARTITION BY group_id, sub_group_id ${orderByString}) as rank,
    COUNT(*) OVER (PARTITION by group_id, sub_group_id) as total_issues from fi) 
    SELECT ri.*, ${fieldsFragment}
    FROM ranked_issues ri
    JOIN issues i ON ri.id = i.id
    WHERE rank <= ${per_page}

    `;

    log("###", sql);

    return sql;
  }
  if (group_by) {
    const orderByString = getOrderByFragment(order_by);
    sql = getFilteredRowsForGrouping(projectId, queries);
    sql += `, ranked_issues AS ( SELECT fi.*,
    ROW_NUMBER() OVER (PARTITION BY group_id ${orderByString}) as rank,
    COUNT(*) OVER (PARTITION by group_id) as total_issues FROM fi)
    SELECT ri.*, ${fieldsFragment}
    FROM ranked_issues ri
    JOIN issues i ON ri.id = i.id
        WHERE rank <= ${per_page}
    `;

    log("###", sql);

    return sql;
  }

  if (order_by && Object.keys(SPECIAL_ORDER_BY).includes(order_by)) {
    const name = order_by.replace("-", "");
    const orderByString = getOrderByFragment(order_by, "i.");

    sql = `WITH sorted_issues AS (`;
    sql += getFilteredRowsForGrouping(projectId, queries);
    sql += `SELECT fi.* , `;
    if (order_by.includes("assignee")) {
      sql += ` s.first_name as ${name} `;
    } else {
      sql += `  s.name as ${name} `;
    }
    sql += `FROM fi `;
    if (order_by && Object.keys(SPECIAL_ORDER_BY).includes(order_by)) {
      if (order_by.includes("cycle")) {
        sql += ` 
        LEFT JOIN cycles s on fi.cycle_id = s.id`;
      }
      if (order_by.includes("estimate_point")) {
        sql += `
        LEFT JOIN estimate_points s on fi.estimate_point = s.id`;
      }
      if (order_by.includes("state")) {
        sql += `
        LEFT JOIN states s on fi.state_id = s.id`;
      }
      if (order_by.includes("label")) {
        sql += ` 
        LEFT JOIN issue_meta sm ON fi.id = sm.issue_id AND sm.key = 'label_ids'
        LEFT JOIN labels s ON s.id = sm.value`;
      }
      if (order_by.includes("module")) {
        sql += ` 
        LEFT JOIN issue_meta sm ON fi.id = sm.issue_id AND sm.key = 'module_ids'
        LEFT JOIN modules s ON s.id = sm.value`;
      }

      if (order_by.includes("assignee")) {
        sql += ` 
        LEFT JOIN issue_meta sm ON fi.id = sm.issue_id AND sm.key = 'assignee_ids'
        LEFT JOIN members s ON s.id = sm.value`;
      }

      sql += ` ORDER BY ${name} ASC NULLS LAST`;
    }
    sql += `)`;

    sql += `SELECT ${fieldsFragment}, group_concat(si.${name}) as ${name} from sorted_issues si JOIN issues i ON si.id = i.id
    `;
    sql += ` group by i.id ${orderByString} LIMIT ${pageSize} OFFSET ${offset * 1 + page * pageSize};`;

    log("######$$$", sql);
    return sql;
  }

  const filterJoinFields = getMetaKeys(queries);
  const orderByString = getOrderByFragment(order_by);

  sql = `SELECT ${fieldsFragment}`;
  if (otherProps.state_group) {
    sql += `, states.'group' as state_group`;
  }
  sql += ` from issues i
  `;

  if (otherProps.state_group) {
    sql += `LEFT JOIN states ON i.state_id = states.id `;
  }
  filterJoinFields.forEach((field: string) => {
    const value = otherProps[field] || "";
    sql += ` INNER JOIN issue_meta ${field} ON i.id = ${field}.issue_id AND ${field}.key = '${field}' AND ${field}.value  IN ('${value.split(",").join("','")}')
    `;
  });

  sql += ` WHERE i.project_id = '${projectId}'    ${singleFilterConstructor(otherProps)} group by i.id  `;
  sql += orderByString;

  // Add offset and paging to query
  sql += ` LIMIT  ${pageSize} OFFSET ${offset * 1 + page * pageSize};`;

  log("$$$", sql);
  return sql;
};

export const issueFilterCountQueryConstructor = (workspaceSlug: string, projectId: string, queries: any) => {
  //@todo Very crude way to extract count from the actual query. Needs to be refactored
  // Remove group by from the query to fallback to non group query
  const { group_by, sub_group_by, order_by, ...otherProps } = queries;
  let sql = issueFilterQueryConstructor(workspaceSlug, projectId, otherProps);
  const fieldsFragment = getIssueFieldsFragment();

  sql = sql.replace(`SELECT ${fieldsFragment}`, "SELECT COUNT(DISTINCT i.id) as total_count");
  // Remove everything after group by i.id
  sql = `${sql.split("group by i.id")[0]};`;
  return sql;
};
