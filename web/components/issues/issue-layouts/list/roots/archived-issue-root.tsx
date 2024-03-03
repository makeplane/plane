import { FC } from "react";
import { observer } from "mobx-react-lite";
// components
import { ArchivedIssueQuickActions } from "components/issues";
// constants
import { BaseListRoot } from "../base-list-root";
import { EIssuesStoreType } from "constants/issue";

export const ArchivedIssueListLayout: FC = observer(() => {
  const canEditPropertiesBasedOnProject = () => false;

  return (
    <BaseListRoot
      QuickActions={ArchivedIssueQuickActions}
      storeType={EIssuesStoreType.ARCHIVED}
      canEditPropertiesBasedOnProject={canEditPropertiesBasedOnProject}
    />
  );
});
