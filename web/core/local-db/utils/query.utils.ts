import { ARRAY_FIELDS, GROUP_BY_MAP } from "./constants";
import { wrapDateTime } from "./utils";

export const translateQueryParams = (queries: any) => {
  const { labels, assignees, state, cycle, module, ...otherProps } = queries;

  if (state) otherProps.state_id = state;
  if (cycle) otherProps.cycle_id = cycle;
  if (module) otherProps.module_ids = module;
  if (labels) otherProps.label_ids = labels;
  if (assignees) otherProps.assignee_ids = assignees;

  return otherProps;
};

export const getOrderByFragment = (order_by: string) => {
  let orderByString = "";
  if (!order_by) return orderByString;

  if (order_by.includes("priority")) {
    order_by = order_by.replace("priority", "priority_proxy");
  }
  if (order_by.startsWith("-")) {
    orderByString += ` ORDER BY ${wrapDateTime(order_by.slice(1))} DESC NULLS LAST, created_at DESC`;
  } else {
    orderByString += ` ORDER BY ${wrapDateTime(order_by)} ASC NULLS LAST, created_at DESC`;
  }
  return orderByString;
};

export const getSubGroupByFragment = (sub_group_by: string) => {
  let subGroupByString = "";
  if (!sub_group_by) return subGroupByString;

  if (ARRAY_FIELDS.includes(sub_group_by)) {
    subGroupByString = `,m.value ${sub_group_by} `;
  } else {
    subGroupByString = `, im.value as sub_group_id`;
  }
};

export const isMetaJoinRequired = (groupBy: string, subGroupBy: string) =>
  ARRAY_FIELDS.includes(groupBy) || ARRAY_FIELDS.includes(subGroupBy);

export const getMetaKeysFragment = (queries: any) => {
  const { group_by, sub_group_by, ...otherProps } = translateQueryParams(queries);

  const translatedGroupBy = GROUP_BY_MAP[group_by];
  const translatedSubGroupBy = GROUP_BY_MAP[sub_group_by];

  const fields = new Set();
  if (ARRAY_FIELDS.includes(translatedGroupBy)) {
    fields.add(translatedGroupBy);
  }

  if (ARRAY_FIELDS.includes(translatedSubGroupBy)) {
    fields.add(translatedSubGroupBy);
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
