import { PlusIcon } from "lucide-react";
// components
import { EmptyState } from "components/common";
import { Button } from "@plane/ui";
// assets
import emptyIssue from "public/empty-state/issue.svg";
import { ExistingIssuesListModal } from "components/core";
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
import { ISearchIssueResponse } from "types";
import useToast from "hooks/use-toast";
import { useState } from "react";

type Props = {
  workspaceSlug: string | undefined;
  projectId: string | undefined;
  moduleId: string | undefined;
};

export const ModuleEmptyState: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, moduleId } = props;
  // states
  const [moduleIssuesListModal, setModuleIssuesListModal] = useState(false);

  const { moduleIssue: moduleIssueStore } = useMobxStore();

  const { setToastAlert } = useToast();

  const handleAddIssuesToModule = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !moduleId) return;

    const issueIds = data.map((i) => i.id);

    await moduleIssueStore
      .addIssueToModule(workspaceSlug.toString(), projectId.toString(), moduleId.toString(), issueIds)
      .catch(() =>
        setToastAlert({
          type: "error",
          title: "Error!",
          message: "Selected issues could not be added to the module. Please try again.",
        })
      );
  };

  return (
    <>
      <ExistingIssuesListModal
        isOpen={moduleIssuesListModal}
        handleClose={() => setModuleIssuesListModal(false)}
        searchParams={{ module: true }}
        handleOnSubmit={handleAddIssuesToModule}
      />
      <div className="h-full w-full grid place-items-center">
        <EmptyState
          title="Module issues will appear here"
          description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
          image={emptyIssue}
          primaryButton={{
            text: "New issue",
            icon: <PlusIcon className="h-3 w-3" strokeWidth={2} />,
            onClick: () => {
              const e = new KeyboardEvent("keydown", {
                key: "c",
              });
              document.dispatchEvent(e);
            },
          }}
          secondaryButton={
            <Button
              variant="neutral-primary"
              prependIcon={<PlusIcon className="h-3 w-3" strokeWidth={2} />}
              onClick={() => setModuleIssuesListModal(true)}
            >
              Add an existing issue
            </Button>
          }
        />
      </div>
    </>
  );
});
