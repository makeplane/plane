"use client";

import React from "react";
import { observer } from "mobx-react";
// types
import { IStateLite } from "@plane/types";
// ui
import { StateGroupIcon } from "@plane/ui";

type Props = {
  state: IStateLite;
};

export const IssueListLayoutHeader: React.FC<Props> = observer((props) => {
  const { state } = props;

  return (
    <div className="flex items-center gap-2 p-3">
      <div className="flex h-3.5 w-3.5 items-center justify-center">
        <StateGroupIcon stateGroup={state.group} color={state.color} height="14" width="14" />
      </div>
      <div className="mr-1 font-medium capitalize">{state?.name}</div>
      {/* <div className="text-sm font-medium text-custom-text-200">{count}</div> */}
    </div>
  );
});
