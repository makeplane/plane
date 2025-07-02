"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// constants
import { EPageAccess } from "@plane/constants";
// plane imports
import { Button } from "@plane/ui";
// plane web hooks
import { usePageShareForm } from "@/plane-web/hooks/pages/use-page-share-form";
import { EPageStoreType } from "@/plane-web/hooks/store";
import { usePageFlag } from "@/plane-web/hooks/use-page-flag";
// store
import { TPageInstance } from "@/store/pages/base-page";
// local imports
import { SharePageRoolModal } from "../modals/share-page-root-modal";

type TPageShareControlProps = {
  page: TPageInstance;
  storeType: EPageStoreType;
};

export const PageShareControl: React.FC<TPageShareControlProps> = observer((props) => {
  const { page, storeType } = props;

  // states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isSharedUsersAccordionOpen, setIsSharedUsersAccordionOpen] = useState(false);

  // navigation
  const { workspaceSlug } = useParams();

  // page flag
  const { isPageSharingEnabled } = usePageFlag({
    workspaceSlug: workspaceSlug?.toString() ?? "",
  });

  const shareForm = usePageShareForm(page);

  // Only show share functionality for top-level pages (no parent) and when feature is enabled
  const canShare =
    !page.parent_id &&
    page.access === EPageAccess.PRIVATE &&
    isPageSharingEnabled &&
    storeType === EPageStoreType.WORKSPACE;

  if (!canShare) return null;

  return (
    <>
      <Button variant="neutral-primary" size="sm" onClick={() => setIsShareModalOpen(true)} className="h-6">
        Share
      </Button>
      <SharePageRoolModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        page={page}
        storeType={storeType}
        shareForm={shareForm}
        isSharedUsersAccordionOpen={isSharedUsersAccordionOpen}
        onToggleSharedUsersAccordion={() => setIsSharedUsersAccordionOpen((prev) => !prev)}
      />
    </>
  );
});
