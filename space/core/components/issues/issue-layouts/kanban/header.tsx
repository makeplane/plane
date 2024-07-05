"use client";

import { observer } from "mobx-react";
// types
import { IStateLite } from "@plane/types";
// ui
import { StateGroupIcon } from "@plane/ui";

type Props = {
  state: IStateLite;
};

export const IssueKanBanHeader: React.FC<Props> = observer((props) => {
  const { state } = props;

  return (
    <div className="flex items-center gap-2 px-2 pb-2">
      <div className="flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center">
        <StateGroupIcon stateGroup={state.group} color={state.color} height="14" width="14" />
      </div>
      <div className="mr-1 truncate font-medium capitalize text-custom-text-200">{state?.name}</div>
      {/* <span className="flex-shrink-0 rounded-full text-custom-text-300">{getCountOfIssuesByState(state.id)}</span> */}
    </div>
  );
});
