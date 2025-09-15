import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EPageAccess, TEAMSPACE_PAGE_TRACKER_ELEMENTS, TEAMSPACE_PAGE_TRACKER_EVENTS } from "@plane/constants";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// components
// hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useAppRouter } from "@/hooks/use-app-router";
// plane web imports
import { EPageStoreType, usePageStore } from "@/plane-web/hooks/store";

type TeamspacePagesListHeaderActionsProps = {
  teamspaceId: string;
  isEditingAllowed: boolean;
};

export const TeamspacePagesListHeaderActions = observer((props: TeamspacePagesListHeaderActionsProps) => {
  const { teamspaceId, isEditingAllowed } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug: routerWorkspaceSlug } = useParams();
  const workspaceSlug = routerWorkspaceSlug?.toString();
  // states
  const [isCreatingPage, setIsCreatingPage] = useState(false);
  // plane web hooks
  const { filters, createPage } = usePageStore(EPageStoreType.TEAMSPACE);

  const handleCreatePage = async () => {
    setIsCreatingPage(true);
    // Create page
    await createPage({
      access: EPageAccess.PUBLIC,
    })
      .then((res) => {
        const pageRedirectionLink = `/${workspaceSlug}/teamspaces/${teamspaceId}/pages/${res?.id}`;
        router.push(pageRedirectionLink);
        captureSuccess({
          eventName: TEAMSPACE_PAGE_TRACKER_EVENTS.PAGE_CREATE,
          payload: {
            id: res?.id,
            teamspaceId,
          },
        });
      })
      .catch((err) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: err?.data?.error || "Page could not be created. Please try again.",
        });
        captureError({
          eventName: TEAMSPACE_PAGE_TRACKER_EVENTS.PAGE_CREATE,
          payload: {
            teamspaceId,
          },
        });
      })
      .finally(() => setIsCreatingPage(false));
  };

  if (!workspaceSlug || !teamspaceId || !filters) return;

  return (
    <>
      {isEditingAllowed && (
        <Button
          variant="primary"
          size="sm"
          onClick={handleCreatePage}
          loading={isCreatingPage}
          data-ph-element={TEAMSPACE_PAGE_TRACKER_ELEMENTS.HEADER_CREATE_PAGE_BUTTON}
        >
          {isCreatingPage ? "Adding" : "Add page"}
        </Button>
      )}
    </>
  );
});
