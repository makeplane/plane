import { FC, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
// types
import { IWorkspace } from "@plane/types";
// ui
import { AlertModalCore, Button, Collapsible } from "@plane/ui";
// components
import { DeleteWorkspaceModal } from "@/components/workspace";
// plane web hooks
import { useAppRouter } from "@/hooks/use-app-router";
import { useWorkspaceSubscription } from "@/plane-web/hooks/store";

type TDeleteWorkspace = {
  workspace: IWorkspace | null;
};

export const DeleteWorkspaceSection: FC<TDeleteWorkspace> = observer((props) => {
  const { workspace } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // states
  const [isOpen, setIsOpen] = useState(false);
  const [deleteWorkspaceModal, setDeleteWorkspaceModal] = useState(false);
  const [redirectingToBillingPage, setRedirectingToBillingPage] = useState(false);
  const [activeSubscriptionModal, setActiveSubscriptionModal] = useState(false);
  // store hooks
  const { currentWorkspaceSubscribedPlanDetail } = useWorkspaceSubscription();
  // derived values
  const isAnySubscriptionActive =
    currentWorkspaceSubscribedPlanDetail && currentWorkspaceSubscribedPlanDetail?.product !== "FREE";

  const handleDeleteWorkspace = () => {
    if (isAnySubscriptionActive) {
      setActiveSubscriptionModal(true);
    } else {
      setDeleteWorkspaceModal(true);
    }
  };

  const handleBillingPageRedirection = () => {
    setRedirectingToBillingPage(true);
    router.push(`/${workspaceSlug}/settings/billing`);
  };

  return (
    <>
      <AlertModalCore
        variant="primary"
        handleClose={() => setActiveSubscriptionModal(false)}
        handleSubmit={handleBillingPageRedirection}
        isOpen={activeSubscriptionModal}
        title="Active Subscription"
        isSubmitting={redirectingToBillingPage}
        content={
          <>
            You have an active subscription. Please visit the billing page to cancel your subscription before deleting
            your workspace.
          </>
        }
        secondaryButtonText="Close"
        primaryButtonText={{
          loading: "Redirecting...",
          default: "Go to billing",
        }}
      />
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
                <span className="text-lg tracking-tight">Delete Workspace</span>
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
                <Button variant="danger" onClick={handleDeleteWorkspace}>
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
