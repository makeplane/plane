import { FC } from "react";
import { observer } from "mobx-react";
import { PlusIcon } from "lucide-react";
import { Row } from "@plane/ui";
import { TQuickAddIssueButton } from "../root";
import { useTranslation } from "@plane/i18n";

export const ListQuickAddIssueButton: FC<TQuickAddIssueButton> = observer((props) => {
  const { onClick } = props;
  const { t } = useTranslation();

  return (
    <Row
      className="flex w-full cursor-pointer items-center gap-2 py-3 text-custom-text-350 hover:text-custom-text-300"
      onClick={onClick}
    >
      <PlusIcon className="h-3.5 w-3.5 stroke-2" />
      <span className="text-sm font-medium">{t("new_issue")}</span>
    </Row>
  );
});
