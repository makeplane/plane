import type { FC } from "react";
import { observer } from "mobx-react";
// local imports
import { ArchivedIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseListRoot } from "../base-list-root";

export const ArchivedIssueListLayout: FC = observer(() => {
  const canEditPropertiesBasedOnProject = () => false;

  return (
    <BaseListRoot
      QuickActions={ArchivedIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});
