import { FC, useState } from "react";
import { observer } from "mobx-react";
import { ChevronDown, ChevronUp } from "lucide-react";
// types
import { IWorkspace } from "@plane/types";
// ui
import { Button, Collapsible } from "@plane/ui";
// components
import { DeleteWorkspaceModal } from "@/components/workspace";

type TDeleteWorkspace = {
  workspace: IWorkspace | null;
};

export const DeleteWorkspaceSection: FC<TDeleteWorkspace> = observer((props) => {
  const { workspace } = props;
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);

  return (
    <>
      <DeleteWorkspaceModal
        data={workspace}
        isOpen={deleteWorkspaceModal}
        onClose={() => setDeleteWorkspaceModal(false)}
      />
      <div className="border-t border-custom-border-100">
        <div className="w-full">
          <Collapsible
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            className="w-full"
            buttonClassName="flex w-full items-center justify-between py-4"
            title={
              <>
                <span className="text-lg tracking-tight">Delete workspace</span>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <span className="text-base tracking-tight">
                When deleting a workspace, all of the data and resources within that workspace will be permanently
                removed and cannot be recovered.
              </span>
              <div>
                <Button variant="danger" onClick={() => setDeleteWorkspaceModal(true)}>
                  Delete my workspace
                </Button>
              </div>
            </div>
          </Collapsible>
        </div>
      </div>
    </>
  );
});
