import type { FC } from "react";
import { observer } from "mobx-react";
// local imports
import { ArchivedIssueQuickActions } from "../../quick-action-dropdowns";
import { BaseListRoot } from "../base-list-root";

export const ArchivedIssueListLayout = observer(function ArchivedIssueListLayout() {
  const canEditPropertiesBasedOnProject = () => false;

  return (
    <BaseListRoot
      QuickActions={ArchivedIssueQuickActions}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});
