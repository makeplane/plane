import { EIssuesStoreType } from "constants/issue";
import { ProjectEmptyState } from "./project-issues";
import { ProjectViewEmptyState } from "./project-view";
import { ProjectArchivedEmptyState } from "./archived-issues";
import { CycleEmptyState } from "./cycle";
import { ModuleEmptyState } from "./module";
import { ProjectDraftEmptyState } from "./draft-issues";
import { GlobalViewEmptyState } from "./global-view";

interface Props {
  storeType: EIssuesStoreType;
}

export const IssueLayoutEmptyState = (props: Props) => {
  switch (props.storeType) {
    case EIssuesStoreType.PROJECT:
      return <ProjectEmptyState />;
    case EIssuesStoreType.PROJECT_VIEW:
      return <ProjectViewEmptyState />;
    case EIssuesStoreType.ARCHIVED:
      return <ProjectArchivedEmptyState />;
    case EIssuesStoreType.CYCLE:
      return <CycleEmptyState />;
    case EIssuesStoreType.MODULE:
      return <ModuleEmptyState />;
    case EIssuesStoreType.DRAFT:
      return <ProjectDraftEmptyState />;
    case EIssuesStoreType.GLOBAL:
      return <GlobalViewEmptyState />;
    default:
      return null;
  }
};
