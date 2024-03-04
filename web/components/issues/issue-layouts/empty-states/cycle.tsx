import { useState } from "react";
import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
import { useTheme } from "next-themes";
// hooks
import { useApplication, useEventTracker, useIssueDetail, useIssues, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { ExistingIssuesListModal } from "components/core";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// types
import { ISearchIssueResponse, TIssueLayouts } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";
import { CYCLE_EMPTY_STATE_DETAILS, EMPTY_FILTER_STATE_DETAILS } from "constants/empty-state";

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
  activeLayout: TIssueLayouts | undefined;
  handleClearAllFilters: () => void;
  isEmptyFilters?: boolean;
};

interface EmptyStateProps {
  title: string;
  image: string;
  description?: string;
  comicBox?: { title: string; description: string };
  primaryButton?: { text: string; icon?: React.ReactNode; onClick: () => void };
  secondaryButton?: { text: string; icon?: React.ReactNode; onClick: () => void };
  size?: "lg" | "sm" | undefined;
  disabled?: boolean | undefined;
}

export const CycleEmptyState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, cycleId, activeLayout, handleClearAllFilters, isEmptyFilters = false } = props;
  // states
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { issues } = useIssues(EIssuesStoreType.CYCLE);
  const { updateIssue, fetchIssue } = useIssueDetail();
  const {
    commandPalette: { toggleCreateIssueModal },
  } = useApplication();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole: userRole },
    currentUser,
  } = useUser();

  const { setToastAlert } = useToast();

  const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    const issueIds = data.map((i) => i.id);

    await issues.addIssueToCycle(workspaceSlug.toString(), projectId, cycleId.toString(), issueIds).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Selected issues could not be added to the cycle. Please try again.",
      });
    });
  };

  const emptyStateDetail = CYCLE_EMPTY_STATE_DETAILS["no-issues"];

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const currentLayoutEmptyStateImagePath = getEmptyStateImagePath("empty-filters", activeLayout ?? "list", isLightMode);
  const emptyStateImage = getEmptyStateImagePath("cycle-issues", activeLayout ?? "list", isLightMode);

  const isEditingAllowed = !!userRole && userRole >= EUserProjectRoles.MEMBER;

  const emptyStateProps: EmptyStateProps = isEmptyFilters
    ? {
        title: EMPTY_FILTER_STATE_DETAILS["project"].title,
        image: currentLayoutEmptyStateImagePath,
        secondaryButton: {
          text: EMPTY_FILTER_STATE_DETAILS["project"].secondaryButton.text,
          onClick: handleClearAllFilters,
        },
      }
    : {
        title: emptyStateDetail.title,
        description: emptyStateDetail.description,
        image: emptyStateImage,
        primaryButton: {
          text: emptyStateDetail.primaryButton.text,
          icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
          onClick: () => {
            setTrackElement("Cycle issue empty state");
            toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
          },
        },
        secondaryButton: {
          text: emptyStateDetail.secondaryButton.text,
          icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
          onClick: () => setCycleIssuesListModal(true),
        },
        size: "sm",
        disabled: !isEditingAllowed,
      };

  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={cycleIssuesListModal}
        handleClose={() => setCycleIssuesListModal(false)}
        searchParams={{ cycle: true }}
        handleOnSubmit={handleAddIssuesToCycle}
      />
      <div className="grid h-full w-full place-items-center">
        <EmptyState {...emptyStateProps} />
      </div>
    </>
  );
});
