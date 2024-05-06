import { FC, useState } from "react";
import { useRouter } from "next/router";
// types
import { TPage } from "@plane/types";
// components
import { EModalPosition, EModalWidth, ModalCore } from "@/components/core";
import { PageForm } from "@/components/pages";
// constants
import { PAGE_CREATED } from "@/constants/event-tracker";
import { EPageAccess } from "@/constants/page";
// hooks
import { useProjectPages, useEventTracker } from "@/hooks/store";

type Props = {
  workspaceSlug: string;
  projectId: string;
  isModalOpen: boolean;
  handleModalClose: () => void;
  redirectionEnabled?: boolean;
};

export const CreatePageModal: FC<Props> = (props) => {
  const { workspaceSlug, projectId, isModalOpen, handleModalClose, redirectionEnabled = false } = props;
  // states
  const [pageFormData, setPageFormData] = useState<Partial<TPage>>({
    id: undefined,
    name: "",
    access: EPageAccess.PUBLIC,
  });
  // router
  const router = useRouter();
  // store hooks
  const { createPage } = useProjectPages(projectId);
  const { capturePageEvent } = useEventTracker();
  const handlePageFormData = <T extends keyof TPage>(key: T, value: TPage[T]) =>
    setPageFormData((prev) => ({ ...prev, [key]: value }));

  const handleStateClear = () => {
    setPageFormData({ id: undefined, name: "", access: EPageAccess.PUBLIC });
    handleModalClose();
  };

  const handleFormSubmit = async () => {
    if (!workspaceSlug || !projectId) return;

    try {
      const pageData = await createPage(pageFormData);
      if (pageData) {
        capturePageEvent({
          eventName: PAGE_CREATED,
          payload: {
            ...pageData,
            state: "SUCCESS",
          },
        });
        handleStateClear();
        if (redirectionEnabled) router.push(`/${workspaceSlug}/projects/${projectId}/pages/${pageData.id}`);
      }
    } catch {
      capturePageEvent({
        eventName: PAGE_CREATED,
        payload: {
          state: "FAILED",
        },
      });
    }
  };

  return (
    <ModalCore
      isOpen={isModalOpen}
      handleClose={handleModalClose}
      position={EModalPosition.TOP}
      width={EModalWidth.XXL}
    >
      <PageForm
        formData={pageFormData}
        handleFormData={handlePageFormData}
        handleModalClose={handleStateClear}
        handleFormSubmit={handleFormSubmit}
      />
    </ModalCore>
  );
};
