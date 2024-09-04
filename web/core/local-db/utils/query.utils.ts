import { ARRAY_FIELDS, GROUP_BY_MAP, PRIORITY_MAP } from "./constants";
import { SPECIAL_ORDER_BY } from "./query-constructor";
import { issueSchema } from "./schemas";
import { wrapDateTime } from "./utils";

export const translateQueryParams = (queries: any) => {
  const { group_by, sub_group_by, labels, assignees, state, cycle, module, priority, ...otherProps } = queries;

  const order_by = queries.order_by;
  if (state) otherProps.state_id = state;
  if (cycle) otherProps.cycle_id = cycle;
  if (module) otherProps.module_ids = module;
  if (labels) otherProps.label_ids = labels;
  if (assignees) otherProps.assignee_ids = assignees;
  if (group_by) otherProps.group_by = GROUP_BY_MAP[group_by as keyof typeof GROUP_BY_MAP];
  if (sub_group_by) otherProps.sub_group_by = GROUP_BY_MAP[sub_group_by as keyof typeof GROUP_BY_MAP];
  if (priority) {
    otherProps.priority_proxy = priority
      .split(",")
      .map((priority: string) => PRIORITY_MAP[priority as keyof typeof PRIORITY_MAP])
      .join(",");
  }

  if (order_by?.includes("priority")) {
    otherProps.order_by = order_by.replace("priority", "priority_proxy");
  }

  // For each property value, replace None with empty string
  Object.keys(otherProps).forEach((key) => {
    if (otherProps[key] === "None") {
      otherProps[key] = "";
    }
  });

  return otherProps;
};

export const getOrderByFragment = (order_by: string) => {
  let orderByString = "";
  if (!order_by) return orderByString;

  if (order_by.startsWith("-")) {
    orderByString += ` ORDER BY ${wrapDateTime(order_by.slice(1))} DESC NULLS LAST, i.created_at DESC`;
  } else {
    orderByString += ` ORDER BY ${wrapDateTime(order_by)} ASC NULLS LAST, i.created_at DESC`;
  }
  return orderByString;
};

export const isMetaJoinRequired = (groupBy: string, subGroupBy: string) =>
  ARRAY_FIELDS.includes(groupBy) || ARRAY_FIELDS.includes(subGroupBy);

export const getMetaKeysFragment = (queries: any) => {
  const { group_by, sub_group_by, ...otherProps } = translateQueryParams(queries);

  const fields: Set<string> = new Set();
  if (ARRAY_FIELDS.includes(group_by)) {
    fields.add(group_by);
  }

  if (ARRAY_FIELDS.includes(sub_group_by)) {
    fields.add(sub_group_by);
  }

  const keys = Object.keys(otherProps);

  keys.forEach((field: string) => {
    if (ARRAY_FIELDS.includes(field)) {
      fields.add(field);
    }
  });

  let sql;

  sql = `  ('${Array.from(fields).join("','")}')`;

  return sql;
};

export const getMetaKeys = (queries: any): string[] => {
  const { group_by, sub_group_by, ...otherProps } = translateQueryParams(queries);

  const fields: Set<string> = new Set();
  if (ARRAY_FIELDS.includes(group_by)) {
    fields.add(group_by);
  }

  if (ARRAY_FIELDS.includes(sub_group_by)) {
    fields.add(sub_group_by);
  }

  const keys = Object.keys(otherProps);

  keys.forEach((field: string) => {
    if (ARRAY_FIELDS.includes(field)) {
      fields.add(field);
    }
  });

  return Array.from(fields);
};

const areJoinsRequired = (queries: any) => {
  const { group_by, sub_group_by, ...otherProps } = translateQueryParams(queries);

  if (ARRAY_FIELDS.includes(group_by) || ARRAY_FIELDS.includes(sub_group_by)) {
    return true;
  }
  if (Object.keys(otherProps).some((field) => ARRAY_FIELDS.includes(field))) {
    return true;
  }
  return false;
};

// Apply filters to the query
export const getFilteredRowsForGrouping = (projectId: string, queries: any) => {
  const { group_by, sub_group_by, ...otherProps } = translateQueryParams(queries);

  const filterJoinFields = getMetaKeys(otherProps);

  const temp = getSingleFilterFields(queries);
  const issueTableFilterFields = temp.length ? "," + temp.join(",") : "";

  const joinsRequired = areJoinsRequired(queries);

  let sql = "";
  if (!joinsRequired) {
    sql = `WITH fi as (SELECT i.id,i.created_at ${issueTableFilterFields}`;
    if (group_by) {
      if (group_by === "target_date") {
        sql += `, date(i.${group_by}) as group_id`;
      } else {
        sql += `, i.${group_by} as group_id`;
      }
    }
    if (sub_group_by) {
      sql += `, i.${sub_group_by} as sub_group_id`;
    }
    sql += ` FROM issues i WHERE project_id = '${projectId}' ${singleFilterConstructor(otherProps)}) `;
    return sql;
  }

  sql = `WITH fi AS (`;
  sql += `SELECT i.id,i.created_at ${issueTableFilterFields} `;
  if (group_by) {
    if (ARRAY_FIELDS.includes(group_by)) {
      sql += `, ${group_by}.value as group_id`;
    } else if (group_by === "target_date") {
      sql += `, date(i.${group_by}) as group_id`;
    } else {
      sql += `, i.${group_by} as group_id`;
    }
  }
  if (sub_group_by) {
    if (ARRAY_FIELDS.includes(sub_group_by)) {
      sql += `, ${sub_group_by}.value as sub_group_id`;
    } else {
      sql += `, i.${sub_group_by} as sub_group_id`;
    }
  }

  sql += ` from issues i
  `;
  filterJoinFields.forEach((field: string) => {
    sql += ` INNER JOIN issue_meta ${field} ON i.id = ${field}.issue_id AND ${field}.key = '${field}' AND ${field}.value  IN ('${otherProps[field].split(",").join("','")}')
    `;
  });

  // If group by field is not already joined, join it
  if (ARRAY_FIELDS.includes(group_by) && !filterJoinFields.includes(group_by)) {
    sql += ` LEFT JOIN issue_meta ${group_by} ON i.id = ${group_by}.issue_id AND ${group_by}.key = '${group_by}'
    `;
  }
  if (ARRAY_FIELDS.includes(sub_group_by) && !filterJoinFields.includes(sub_group_by)) {
    sql += ` LEFT JOIN issue_meta ${sub_group_by} ON i.id = ${sub_group_by}.issue_id AND ${sub_group_by}.key = '${sub_group_by}'
    `;
  }

  sql += ` WHERE i.project_id = '${projectId}' ${singleFilterConstructor(otherProps)} 
  `;

  sql += `)
  `;
  return sql;
};

export const singleFilterConstructor = (queries: any) => {
  const { order_by, cursor, per_page, group_by, sub_group_by, sub_issue, target_date, ...filters } =
    translateQueryParams(queries);

  let sql = "";
  if (!sub_issue) {
    sql += ` AND parent_id IS NOT NULL `;
  }
  if (target_date) {
    // "2024-09-29;after,2024-11-02;before"
    const dates = target_date.split(",");
    const start = dates[0].split(";")[0];
    const end = dates[1].split(";")[0];

    sql += ` AND target_date >= date('${start}') AND target_date <= date('${end}') `;
  }
  const keys = Object.keys(filters);

  keys.forEach((key) => {
    const value = filters[key] ? filters[key].split(",") : "";
    if (!value) return;
    if (!ARRAY_FIELDS.includes(key)) {
      sql += ` AND ${key} in ('${value.join("','")}')`;
    }
  });
  //

  return sql;
};

const getSingleFilterFields = (queries: any) => {
  const { order_by, cursor, per_page, group_by, sub_group_by, sub_issue, ...otherProps } =
    translateQueryParams(queries);

  const fields = new Set();

  if (order_by && !order_by.includes("created_at") && !Object.keys(SPECIAL_ORDER_BY).includes(order_by))
    fields.add(order_by.replace("-", ""));

  const keys = Object.keys(otherProps);

  keys.forEach((field: string) => {
    if (!ARRAY_FIELDS.includes(field)) {
      fields.add(field);
    }
  });

  if (order_by.includes("state__name")) {
    fields.add("state_id");
  }
  if (order_by.includes("cycle__name")) {
    fields.add("cycle_id");
  }

  return Array.from(fields);
};

export const getIssueFieldsFragment = () => {
  const { description_html, ...filtered } = issueSchema;
  const keys = Object.keys(filtered);
  const sql = `  ${keys
    .map((key, index) => {
      if (index % 5 === 0) {
        return `i.${key}
      `;
      }
      return `i.${key}`;
    })
    .join(",")}`;
  return sql;
};
