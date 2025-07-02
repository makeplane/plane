import { FC, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronUp, CircleAlert } from "lucide-react";
// types
import { IWorkspace } from "@plane/types";
// ui
import { Button, Collapsible, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { cn  } from "@plane/utils";
// plane web hooks
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";
import { DeleteWorkspaceModal } from "./delete-workspace-modal";

type TDeleteWorkspace = {
  workspace: IWorkspace | null;
};

export const DeleteWorkspaceSection: FC<TDeleteWorkspace> = observer((props) => {
  const { workspace } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);
  const [activeSubscriptionModal, setActiveSubscriptionModal] = useState(false);
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
  // derived values
  const isAnySubscriptionActive = !currentWorkspaceSubscribedPlanDetail?.can_delete_workspace;

  const handleDeleteWorkspace = () => {
    if (isAnySubscriptionActive) {
      setActiveSubscriptionModal(true);
    } else {
      setDeleteWorkspaceModal(true);
    }
  };

  return (
    <>
      <ModalCore
        isOpen={activeSubscriptionModal}
        handleClose={() => setActiveSubscriptionModal(false)}
        position={EModalPosition.CENTER}
        width={EModalWidth.XL}
      >
        <div className="p-5 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <span
            className={cn(
              "flex-shrink-0 grid place-items-center rounded-full size-12 sm:size-10 bg-custom-primary-100/20 text-custom-primary-100"
            )}
          >
            <CircleAlert className="size-5" aria-hidden="true" />
          </span>
          <div className="text-center sm:text-left">
            <h3 className="text-lg font-medium">Cancel your subscription first.</h3>
            <p className="mt-1 text-sm text-custom-text-200">
              {" "}
              You have an active subscription to one of our paid plans. Please go{" "}
              <Link
                href={`/${workspaceSlug}/settings/billing`}
                className="text-custom-primary-200 underline font-semibold"
              >
                here
              </Link>{" "}
              to cancel it first, then come back here to proceed.
            </p>
          </div>
        </div>
        <div className="px-5 pb-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="neutral-primary" size="sm" onClick={() => setActiveSubscriptionModal(false)}>
            Close
          </Button>
        </div>
      </ModalCore>
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
                <span className="text-lg tracking-tight">Delete this workspace</span>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </>
            }
          >
            <div className="flex flex-col gap-4">
              <span className="text-base tracking-tight">
                Tread carefully here. You delete your workspace, you lose all your data, your members can{"’"}t access
                projects and pages, and we can{"’"}t retrieve any of it for you. Proceed only if you are sure you want
                your workspace deleted.
              </span>
              <div>
                <Button variant="danger" onClick={handleDeleteWorkspace}>
                  Delete this workspace
                </Button>
              </div>
            </div>
          </Collapsible>
        </div>
      </div>
    </>
  );
});
