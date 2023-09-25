import React from "react";
// components
import { HeaderCard } from "./card";
// constants
import { issueStateGroupByKey } from "constants/issue";
// mobx
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IStateGroupHeader {
  column_id: string;
  swimlanes?: boolean;
}

export const StateGroupHeader: React.FC<IStateGroupHeader> = observer(({ column_id }) => {
  const {}: RootStore = useMobxStore();

  const stateGroup = column_id && issueStateGroupByKey(column_id);

  return <>{stateGroup && <HeaderCard title={stateGroup?.title || ""} />}</>;
});
