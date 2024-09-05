"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { TIssue } from "@plane/types";
import { Input } from "@plane/ui";
// constants
import { ETabIndices } from "@/constants/tab-indices";
// helpers
import { getTabIndex } from "@/helpers/tab-indices.helper";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TInboxIssueTitle = {
  data: Partial<TIssue>;
  handleData: (issueKey: keyof Partial<TIssue>, issueValue: Partial<TIssue>[keyof Partial<TIssue>]) => void;
  isTitleLengthMoreThan255Character?: boolean;
};

export const InboxIssueTitle: FC<TInboxIssueTitle> = observer((props) => {
  const { data, handleData, isTitleLengthMoreThan255Character } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  const { getIndex } = getTabIndex(ETabIndices.INTAKE_ISSUE_FORM, isMobile);
  return (
    <div className="space-y-1">
      <Input
        id="name"
        name="name"
        type="text"
        value={data?.name}
        onChange={(e) => handleData("name", e.target.value)}
        placeholder="Title"
        className="w-full text-base"
        tabIndex={getIndex("name")}
        required
      />
      {isTitleLengthMoreThan255Character && (
        <span className="text-xs text-red-500">Title should be less than 255 characters</span>
      )}
    </div>
  );
});
