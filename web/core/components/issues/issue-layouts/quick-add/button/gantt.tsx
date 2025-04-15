import { FC } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
import { Row } from "@plane/ui";
import { TQuickAddIssueButton } from "../root";
import { useTranslation } from "@plane/i18n";

export const GanttQuickAddIssueButton: FC<TQuickAddIssueButton> = observer((props) => {
  const { onClick } = props;
  const { t } = useTranslation();

  return (
    <button
      type="button"
      className="sticky bottom-0 z-[1] flex w-full cursor-pointer items-center border-t-[1px] border-custom-border-200 bg-custom-background-100 text-custom-text-350 hover:text-custom-text-300"
      onClick={onClick}
    >
      <Row className="flex py-2 gap-2">
        <PlusIcon className="h-3.5 w-3.5 stroke-2 my-auto" />
        <span className="text-sm font-medium">{t("new_issue")}</span>
      </Row>
    </button>
  );
});
