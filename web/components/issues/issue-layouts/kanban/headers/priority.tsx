import React from "react";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// constants
import { issuePriorityByKey } from "constants/issue";
// mobx
import { observer } from "mobx-react-lite";

export interface IPriorityHeader {
  column_id: string;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
}

export const PriorityHeader: React.FC<IPriorityHeader> = observer(
  ({ column_id, sub_group_by, group_by, header_type, issues_count }) => {
    const priority = column_id && issuePriorityByKey(column_id);

    return (
      <>
        {priority &&
          (sub_group_by && header_type === "sub_group_by" ? (
            <HeaderSubGroupByCard title={priority?.key || ""} column_id={column_id} count={0} />
          ) : (
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={column_id}
              title={priority?.key || ""}
              count={issues_count}
            />
          ))}
      </>
    );
  }
);
