import type { FC } from "react";
import { observer } from "mobx-react";

import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "@plane/propel/icons";
import { Row } from "@plane/ui";
import type { TQuickAddIssueButton } from "../root";

export const ListQuickAddIssueButton = observer(function ListQuickAddIssueButton(props: TQuickAddIssueButton) {
  const { onClick, isEpic = false } = props;
  const { t } = useTranslation();
  return (
    <Row
      className="flex w-full cursor-pointer items-center gap-2 py-3 bg-layer-transparent hover:bg-layer-transparent-hover"
      onClick={onClick}
    >
      <PlusIcon className="h-3.5 w-3.5 stroke-2" />
      <span className="text-13 font-medium">{isEpic ? t("epic.new") : t("issue.new")}</span>
    </Row>
  );
});
