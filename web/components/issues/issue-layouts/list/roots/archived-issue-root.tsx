import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { ArchivedIssueQuickActions } from "@/components/issues";
import { EIssuesStoreType } from "@/constants/issue";
// components
// types
// constants
import { BaseListRoot } from "../base-list-root";

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
