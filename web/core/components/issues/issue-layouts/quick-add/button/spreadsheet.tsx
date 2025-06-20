import { FC } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TQuickAddIssueButton } from "../root";

export const SpreadsheetAddIssueButton: FC<TQuickAddIssueButton> = observer((props) => {
  const { onClick, isEpic = false } = props;
  const { t } = useTranslation();
  return (
    <div className="flex items-center">
      <button
        type="button"
        className="flex items-center gap-x-[6px] rounded-md px-2 pt-3 text-custom-text-350 hover:text-custom-text-300"
        onClick={onClick}
      >
        <PlusIcon className="h-3.5 w-3.5 stroke-2" />
        <span className="text-sm font-medium">{isEpic ? t("epic.add.label") : t("issue.add.label")}</span>
      </button>
    </div>
  );
});
