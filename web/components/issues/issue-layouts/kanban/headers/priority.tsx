import React from "react";
// components
import { HeaderCard } from "./card";
// constants
import { issuePriorityByKey } from "constants/issue";
// mobx
import { observer } from "mobx-react-lite";
// mobx
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export interface IPriorityHeader {
  column_id: string;
}

export const PriorityHeader: React.FC<IPriorityHeader> = observer(({ column_id }) => {
  const {}: RootStore = useMobxStore();

  const stateGroup = column_id && issuePriorityByKey(column_id);

  return <>{stateGroup && <HeaderCard title={stateGroup?.title || ""} />}</>;
});
