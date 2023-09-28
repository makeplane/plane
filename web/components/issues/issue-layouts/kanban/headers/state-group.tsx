import React from "react";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// constants
import { issueStateGroupByKey } from "constants/issue";
// mobx
import { observer } from "mobx-react-lite";

export interface IStateGroupHeader {
  column_id: string;
  sub_group_by: string | null;
  group_by: string | null;
  header_type: "group_by" | "sub_group_by";
  issues_count: number;
}

export const StateIcon = () => {};

export const StateGroupHeader: React.FC<IStateGroupHeader> = observer(
  ({ column_id, sub_group_by, group_by, header_type, issues_count }) => {
    const stateGroup = column_id && issueStateGroupByKey(column_id);

    return (
      <>
        {stateGroup &&
          (sub_group_by && header_type === "sub_group_by" ? (
            <HeaderSubGroupByCard title={stateGroup?.key || ""} column_id={column_id} count={issues_count} />
          ) : (
            <HeaderGroupByCard
              sub_group_by={sub_group_by}
              group_by={group_by}
              column_id={column_id}
              title={stateGroup?.key || ""}
              count={issues_count}
            />
          ))}
      </>
    );
  }
);
