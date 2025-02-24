import { FC } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { TQuickAddIssueButton } from "../root";

export const KanbanQuickAddIssueButton: FC<TQuickAddIssueButton> = observer((props) => {
  const { onClick, isEpic = false } = props;
  const { t } = useTranslation();
  return (
    <div
      className="flex w-full cursor-pointer items-center gap-2 py-1.5 text-custom-text-350 hover:text-custom-text-300"
      onClick={onClick}
    >
      <PlusIcon className="h-3.5 w-3.5 stroke-2" />
      <span className="text-sm font-medium">{isEpic ? t("epic.new") : t("issue.new")}</span>
    </div>
  );
});
