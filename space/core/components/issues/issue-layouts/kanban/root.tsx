"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// components
import { IssueKanBanBlock, IssueKanBanHeader } from "@/components/issues";
// ui
import { Icon } from "@/components/ui";
// mobx hook
import { useIssue } from "@/hooks/store";

type Props = {
  anchor: string;
};

export const IssueKanbanLayoutRoot: FC<Props> = observer((props) => {
  const { anchor } = props;
  // store hooks
  const { states, getFilteredIssuesByState } = useIssue();

  return (
    <div className="relative flex h-full w-full gap-3 overflow-hidden overflow-x-auto">
      {states?.map((state) => {
        const issues = getFilteredIssuesByState(state.id);

        return (
          <div key={state.id} className="relative flex h-full w-[340px] flex-shrink-0 flex-col">
            <div className="flex-shrink-0">
              <IssueKanBanHeader state={state} />
            </div>
            <div className="hide-vertical-scrollbar h-full w-full overflow-hidden overflow-y-auto">
              {issues && issues.length > 0 ? (
                <div className="space-y-3 px-2 pb-2">
                  {issues.map((issue) => (
                    <IssueKanBanBlock key={issue.id} anchor={anchor} issue={issue} params={{}} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 pt-10 text-center text-sm font-medium text-custom-text-200">
                  <Icon iconName="stack" />
                  No issues in this state
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
