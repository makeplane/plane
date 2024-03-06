import { useState } from "react";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
import { PlusIcon } from "lucide-react";
// hooks
import { ExistingIssuesListModal } from "components/core";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
import { EMPTY_FILTER_STATE_DETAILS, MODULE_EMPTY_STATE_DETAILS } from "constants/empty-state";
import { EIssuesStoreType } from "constants/issue";
import { EUserProjectRoles } from "constants/project";
import { useApplication, useEventTracker, useIssues, useUser } from "hooks/store";
// ui
import { TOAST_TYPE, setToast } from "@plane/ui";
// components
// types
import { ISearchIssueResponse, TIssueLayouts } from "@plane/types";
// constants

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  moduleId: string | undefined;
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

export const ModuleEmptyState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, moduleId, activeLayout, handleClearAllFilters, isEmptyFilters = false } = props;
  // states
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const { issues } = useIssues(EIssuesStoreType.MODULE);
  const {
    commandPalette: { toggleCreateIssueModal },
  } = useApplication();
  const { setTrackElement } = useEventTracker();
  const {
    membership: { currentProjectRole: userRole },
    currentUser,
  } = useUser();

  const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const issueIds = data.map((i) => i.id);
    await issues
      .addIssuesToModule(workspaceSlug.toString(), projectId?.toString(), moduleId.toString(), issueIds)
      .catch(() =>
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: "Selected issues could not be added to the module. Please try again.",
        })
      );
  };

  const emptyStateDetail = MODULE_EMPTY_STATE_DETAILS["no-issues"];

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const currentLayoutEmptyStateImagePath = getEmptyStateImagePath("empty-filters", activeLayout ?? "list", isLightMode);
  const emptyStateImage = getEmptyStateImagePath("module-issues", activeLayout ?? "list", isLightMode);

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
            setTrackElement("Module issue empty state");
            toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
          },
        },
        secondaryButton: {
          text: emptyStateDetail.secondaryButton.text,
          icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
          onClick: () => setModuleIssuesListModal(true),
        },
        disabled: !isEditingAllowed,
      };

  return (
    <>
      <ExistingIssuesListModal
        workspaceSlug={workspaceSlug}
        projectId={projectId}
        isOpen={moduleIssuesListModal}
        handleClose={() => setModuleIssuesListModal(false)}
        searchParams={{ module: moduleId != undefined ? moduleId.toString() : "" }}
        handleOnSubmit={handleAddIssuesToModule}
      />
      <div className="grid h-full w-full place-items-center">
        <EmptyState {...emptyStateProps} />
      </div>
    </>
  );
});
