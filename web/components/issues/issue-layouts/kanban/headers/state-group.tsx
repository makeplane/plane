import React from "react";
// components
import { HeaderGroupByCard } from "./group-by-card";
import { HeaderSubGroupByCard } from "./sub-group-by-card";
// constants
import { issueStateGroupByKey } from "constants/issue";
// mobx
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IStateGroupHeader {
  column_id: string;
  type?: "group_by" | "sub_group_by";
}

export const StateIcon = () => {};

export const StateGroupHeader: React.FC<IStateGroupHeader> = observer(({ column_id, type }) => {
  const { issueFilter: issueFilterStore }: RootStore = useMobxStore();

  const stateGroup = column_id && issueStateGroupByKey(column_id);
  const sub_group_by = issueFilterStore?.userDisplayFilters?.sub_group_by ?? null;

  return (
    <>
      {stateGroup &&
        (sub_group_by && type === "sub_group_by" ? (
          <HeaderSubGroupByCard title={stateGroup?.key || ""} />
        ) : (
          <HeaderGroupByCard title={stateGroup?.key || ""} />
        ))}
    </>
  );
});
