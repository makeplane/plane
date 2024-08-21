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

  if (order_by.startsWith("-")) {
    orderByString += ` ORDER BY ${wrapDateTime(order_by.slice(1))} DESC, created_at DESC`;
  } else {
    orderByString += ` ORDER BY ${wrapDateTime(order_by)} ASC, created_at DESC`;
  }
  return orderByString;
};
