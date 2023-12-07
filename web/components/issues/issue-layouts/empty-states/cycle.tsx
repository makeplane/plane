import { useState } from "react";
import { observer } from "mobx-react-lite";
import { PlusIcon } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// hooks
import useToast from "hooks/use-toast";
// components
import { EmptyState } from "components/common";
import { ExistingIssuesListModal } from "components/core";
// ui
import { Button } from "@plane/ui";
// assets
import emptyIssue from "public/empty-state/issue.svg";
// types
import { ISearchIssueResponse } from "types";
import { EProjectStore } from "store/command-palette.store";

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  cycleId: string | undefined;
};

export const CycleEmptyState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, cycleId } = props;
  // states
  const [cycleIssuesListModal, setCycleIssuesListModal] = useState(false);

  const {
    cycleIssues: cycleIssueStore,
    commandPalette: commandPaletteStore,
    trackEvent: { setTrackElement },
  } = useMobxStore();

  const { setToastAlert } = useToast();

  const handleAddIssuesToCycle = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !cycleId) return;

    const issueIds = data.map((i) => i.id);

    await cycleIssueStore.addIssueToCycle(workspaceSlug.toString(), cycleId.toString(), issueIds).catch(() => {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Selected issues could not be added to the cycle. Please try again.",
      });
    });
  };

  return (
    <>
      <ExistingIssuesListModal
        isOpen={cycleIssuesListModal}
        handleClose={() => setCycleIssuesListModal(false)}
        searchParams={{ cycle: true }}
        handleOnSubmit={handleAddIssuesToCycle}
      />
      <div className="h-full w-full grid place-items-center">
        <EmptyState
          title="Cycle issues will appear here"
          description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
          image={emptyIssue}
          primaryButton={{
            text: "New issue",
            icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
            onClick: () => {
              setTrackElement("CYCLE_EMPTY_STATE");
              commandPaletteStore.toggleCreateIssueModal(true, EProjectStore.CYCLE);
            },
          }}
          secondaryButton={
            <Button
              variant="neutral-primary"
              prependIcon={<PlusIcon className="h-3 w-3" strokeWidth={2} />}
              onClick={() => setCycleIssuesListModal(true)}
            >
              Add an existing issue
            </Button>
          }
        />
      </div>
    </>
  );
});
