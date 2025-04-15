import { FC } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
import { TQuickAddIssueButton } from "../root";
import { useTranslation } from "@plane/i18n";

export const SpreadsheetAddIssueButton: FC<TQuickAddIssueButton> = observer((props) => {
  const { onClick } = props;
  const { t } = useTranslation();

  return (
    <div className="flex items-center">
      <button
        type="button"
        className="flex items-center gap-x-[6px] rounded-md px-2 pt-3 text-custom-text-350 hover:text-custom-text-300"
        onClick={onClick}
      >
        <PlusIcon className="h-3.5 w-3.5 stroke-2" />
        <span className="text-sm font-medium">{t("new_issue")}</span>
      </button>
    </div>
  );
});
