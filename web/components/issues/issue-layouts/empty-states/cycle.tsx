import { useState } from "react";
import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// hooks
import { useApplication, useIssueDetail, useIssues, useUser } from "hooks/store";
import useToast from "hooks/use-toast";
// components
import { EmptyState } from "components/common";
import { ExistingIssuesListModal } from "components/core";
// ui
import { Button } from "@plane/ui";
// assets
import emptyIssue from "public/empty-state/issue.svg";
// types
import { ISearchIssueResponse } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";
import { EIssuesStoreType } from "constants/issue";

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
};

export const CycleEmptyState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, cycleId } = props;
  // states
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);
  // store hooks
  const { issues } = useIssues(EIssuesStoreType.CYCLE);
  const { updateIssue, fetchIssue } = useIssueDetail();
  const {
    commandPalette: { toggleCreateIssueModal },
    eventTracker: { setTrackElement },
  } = useApplication();
  const {
    membership: { currentProjectRole: userRole },
  } = useUser();

  const { setToastAlert } = useToast();

  const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    const issueIds = data.map((i) => i.id);

    await issues
      .addIssueToCycle(workspaceSlug.toString(), projectId, cycleId.toString(), issueIds)
      .then((res) => {
        updateIssue(workspaceSlug, projectId, res.id, res);
        fetchIssue(workspaceSlug, projectId, res.id);
      })
      .catch(() => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Selected issues could not be added to the cycle. Please try again.",
        });
      });
  };

  const isEditingAllowed = !!userRole && userRole >= EUserProjectRoles.MEMBER;

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
        <EmptyState
          title="Cycle issues will appear here"
          description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
          image={emptyIssue}
          primaryButton={{
            text: "New issue",
            icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
            onClick: () => {
              setTrackElement("CYCLE_EMPTY_STATE");
              toggleCreateIssueModal(true, EIssuesStoreType.CYCLE);
            },
          }}
          secondaryButton={
            <Button
              variant="neutral-primary"
              prependIcon={<PlusIcon className="h-3 w-3" strokeWidth={2} />}
              onClick={() => setCycleIssuesListModal(true)}
              disabled={!isEditingAllowed}
            >
              Add an existing issue
            </Button>
          }
          disabled={!isEditingAllowed}
        />
      </div>
    </>
  );
});
