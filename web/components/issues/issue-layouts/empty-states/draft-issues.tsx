import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import size from "lodash/size";
import { useTheme } from "next-themes";
// hooks
import { useIssues, useUser } from "hooks/store";
// components
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssueFilterType, EIssuesStoreType } from "constants/issue";
import { EMPTY_FILTER_STATE_DETAILS, EMPTY_ISSUE_STATE_DETAILS } from "constants/empty-state";
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

export const ProjectDraftEmptyState: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    membership: { currentProjectRole },
    currentUser,
  } = useUser();
  const { issuesFilter } = useIssues(EIssuesStoreType.DRAFT);

  const userFilters = issuesFilter?.issueFilters?.filters;
  const activeLayout = issuesFilter?.issueFilters?.displayFilters?.layout;

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const currentLayoutEmptyStateImagePath = getEmptyStateImagePath("empty-filters", activeLayout ?? "list", isLightMode);
  const EmptyStateImagePath = getEmptyStateImagePath("draft", "draft-issues-empty", isLightMode);

  const issueFilterCount = size(
    Object.fromEntries(
      Object.entries(userFilters ?? {}).filter(([, value]) => value && Array.isArray(value) && value.length > 0)
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
          title: EMPTY_FILTER_STATE_DETAILS["draft"].title,
          image: currentLayoutEmptyStateImagePath,
          secondaryButton: {
            text: EMPTY_FILTER_STATE_DETAILS["draft"].secondaryButton.text,
            onClick: handleClearAllFilters,
          },
        }
      : {
          title: EMPTY_ISSUE_STATE_DETAILS["draft"].title,
          description: EMPTY_ISSUE_STATE_DETAILS["draft"].description,
          image: EmptyStateImagePath,
          size: "sm",
          disabled: !isEditingAllowed,
        };

  return (
    <div className="relative h-full w-full overflow-y-auto">
      <EmptyState {...emptyStateProps} />
    </div>
  );
});
