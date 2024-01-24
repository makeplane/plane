import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import size from "lodash/size";
// hooks
import { useIssues, useUser } from "hooks/store";
// components
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";
// types
import { IIssueFilterOptions } from "@plane/types";

interface EmptyStateProps {
  title: string;
  image: string;
  description?: string;
  comicBox?: { title: string; description: string };
  primaryButton?: { text: string; icon?: React.ReactNode; onClick: () => void };
  secondaryButton?: { text: string; onClick: () => void };
  size?: "lg" | "sm" | undefined;
  disabled?: boolean | undefined;
}

export const ProjectArchivedEmptyState: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  const {
    membership: { currentProjectRole },
    currentUser,
  } = useUser();
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);

  const userFilters = issuesFilter?.issueFilters?.filters;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  const currentLayoutEmptyStateImagePath = getEmptyStateImagePath(
    "empty-filters",
    activeLayout ?? "list",
    currentUser?.theme.theme === "light"
  );
  const EmptyStateImagePath = getEmptyStateImagePath("archived", "empty-issues", currentUser?.theme.theme === "light");

  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([key, value]) => value && Array.isArray(value) && value.length > 0)
    )
  );

  const handleClearAllFilters = () => {
    if (!workspaceSlug || !projectId) return;
    const newFilters: IIssueFilterOptions = {};
    Object.keys(userFilters ?? {}).forEach((key) => {
      newFilters[key as keyof IIssueFilterOptions] = null;
    });
    issuesFilter.updateFilters(workspaceSlug.toString(), projectId.toString(), EIssueFilterType.FILTERS, {
      ...newFilters,
    });
  };

  const isEditingAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const emptyStateProps: EmptyStateProps =
    issueFilterCount > 0
      ? {
          title: "No issues found matching the filters applied",
          image: currentLayoutEmptyStateImagePath,
          secondaryButton: {
            text: "Clear all filters",
            onClick: handleClearAllFilters,
          },
        }
      : {
          title: "No archived issues yet",
          description:
            "Archived issues help you remove issues you completed or cancelled from focus. You can set automation to auto archive issues and find them here.",
          image: EmptyStateImagePath,
          primaryButton: {
            text: "Set Automation",
            onClick: () => router.push(`/${workspaceSlug}/projects/${projectId}/settings/automations`),
          },
          size: "sm",
          disabled: !isEditingAllowed,
        };

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyState {...emptyStateProps} />
    </div>
  );
});
