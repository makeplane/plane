import type { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { ETabIndices } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import { Input } from "@plane/ui";
// helpers
import { getTabIndex } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TInboxIssueTitle = {
  data: Partial<TIssue>;
  handleData: (issueKey: keyof Partial<TIssue>, issueValue: Partial<TIssue>[keyof Partial<TIssue>]) => void;
  isTitleLengthMoreThan255Character?: boolean;
};

export const InboxIssueTitle = observer(function InboxIssueTitle(props: TInboxIssueTitle) {
  const { data, handleData, isTitleLengthMoreThan255Character } = props;
  // hooks
  const { isMobile } = usePlatformOS();

  const { getIndex } = getTabIndex(ETabIndices.INTAKE_ISSUE_FORM, isMobile);
  const { t } = useTranslation();
  return (
    <div className="space-y-1">
      <Input
        id="name"
        name="name"
        type="text"
        value={data?.name}
        onChange={(e) => handleData("name", e.target.value)}
        placeholder={t("title")}
        className="w-full text-14"
        tabIndex={getIndex("name")}
        required
      />
      {isTitleLengthMoreThan255Character && (
        <span className="text-11 text-danger-primary">{t("title_should_be_less_than_255_characters")}</span>
      )}
    </div>
  );
});
