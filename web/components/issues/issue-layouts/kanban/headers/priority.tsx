import React from "react";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// constants
import { issuePriorityByKey } from "constants/issue";
// mobx
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IPriorityHeader {
  column_id: string;
  type?: "group_by" | "sub_group_by";
}

export const PriorityHeader: React.FC<IPriorityHeader> = observer(({ column_id, type }) => {
  const { issueFilter: issueFilterStore }: RootStore = useMobxStore();

  const priority = column_id && issuePriorityByKey(column_id);
  const sub_group_by = issueFilterStore?.userDisplayFilters?.sub_group_by ?? null;

  return (
    <>
      {priority &&
        (sub_group_by && type === "sub_group_by" ? (
          <HeaderSubGroupByCard title={priority?.key || ""} />
        ) : (
          <HeaderGroupByCard title={priority?.key || ""} />
        ))}
    </>
  );
});
