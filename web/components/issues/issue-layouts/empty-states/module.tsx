import { useState } from "react";
import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// hooks
import { useApplication, useEventTracker, useIssues, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { ExistingIssuesListModal } from "components/core";
// types
import { ISearchIssueResponse, TIssueLayouts } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";
import { MODULE_EMPTY_STATE_DETAILS } from "constants/empty-state";
import { useTheme } from "next-themes";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  moduleId: string | undefined;
  activeLayout: TIssueLayouts | undefined;
};

export const ModuleEmptyState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, moduleId, activeLayout } = props;
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
  // toast alert
  const { setToastAlert } = useToast();

  const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const issueIds = data.map((i) => i.id);
    await issues
      .addIssuesToModule(workspaceSlug.toString(), projectId?.toString(), moduleId.toString(), issueIds)
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Selected issues could not be added to the module. Please try again.",
        })
      );
  };

  const emptyStateDetail = MODULE_EMPTY_STATE_DETAILS["no-issues"];

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("cycle-issues", activeLayout ?? "list", isLightMode);

  const isEditingAllowed = !!userRole && userRole >= EUserProjectRoles.MEMBER;

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
        <EmptyState
          title={emptyStateDetail.title}
          description={emptyStateDetail.description}
          image={emptyStateImage}
          primaryButton={{
            text: emptyStateDetail.primaryButton.text,
            icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
            onClick: () => {
              setTrackElement("Module issue empty state");
              toggleCreateIssueModal(true, EIssuesStoreType.MODULE);
            },
          }}
          secondaryButton={{
            text: emptyStateDetail.secondaryButton.text,
            icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
            onClick: () => setModuleIssuesListModal(true),
          }}
          disabled={!isEditingAllowed}
        />
      </div>
    </>
  );
});
