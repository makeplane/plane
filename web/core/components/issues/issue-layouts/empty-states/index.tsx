import { EIssuesStoreType } from "@/constants/issue";
// components
import { ProjectArchivedEmptyState } from "./archived-issues";
import { CycleEmptyState } from "./cycle";
import { ProjectDraftEmptyState } from "./draft-issues";
import { GlobalViewEmptyState } from "./global-view";
import { ModuleEmptyState } from "./module";
import { ProfileViewEmptyState } from "./profile-view";
import { ProjectEmptyState } from "./project-issues";
import { ProjectViewEmptyState } from "./project-view";

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
    case EIssuesStoreType.PROFILE:
      return <ProfileViewEmptyState />;
    default:
      return null;
  }
};
