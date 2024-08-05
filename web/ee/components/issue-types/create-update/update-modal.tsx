import { FC, useEffect, useState } from "react";
// ui
import { EModalPosition, EModalWidth, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// plane web components
import { CreateOrUpdateIssueTypeForm, defaultIssueTypeData } from "@/plane-web/components/issue-types/";
// hooks
import { useIssueType } from "@/plane-web/hooks/store";
// plane web types
import { TIssueType } from "@/plane-web/types";

type Props = {
  data: Partial<TIssueType>;
  isModalOpen: boolean;
  handleModalClose: () => void;
};

export const UpdateIssueTypeModal: FC<Props> = (props) => {
  const { data, isModalOpen, handleModalClose } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [issueTypeFormData, setIssueTypeFormData] = useState<Partial<TIssueType> | undefined>(undefined);
  // store hooks
  const issueType = useIssueType(data?.id);

  useEffect(() => {
    if (isModalOpen) {
      setIssueTypeFormData(data);
    }
  }, [data, isModalOpen]);

  // handlers
  const handleFormDataChange = <T extends keyof TIssueType>(key: T, value: TIssueType[T]) =>
    setIssueTypeFormData((prev) => ({ ...prev, [key]: value }));

  const handleFormSubmit = async () => {
    if (!issueTypeFormData) return;

    setIsSubmitting(true);
    await issueType
      ?.updateType(issueTypeFormData)
      .then(() => {
        handleModalClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Issue type ${data?.name} updated successfully.`,
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: `Failed to update issue type. Please try again!`,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  if (!isModalOpen) return null;

  return (
    <ModalCore
      isOpen={isModalOpen}
      handleClose={handleModalClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
    >
      <CreateOrUpdateIssueTypeForm
        formData={issueTypeFormData ?? defaultIssueTypeData}
        isSubmitting={isSubmitting}
        handleFormDataChange={handleFormDataChange}
        handleModalClose={handleModalClose}
        handleFormSubmit={handleFormSubmit}
      />
    </ModalCore>
  );
};
