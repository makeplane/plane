import { FC, useEffect, useState } from "react";
// ui
import { EModalPosition, EModalWidth, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { getRandomIconName } from "@/helpers/emoji.helper";
// plane web components
import { CreateOrUpdateIssueTypeForm } from "@/plane-web/components/issue-types/";
// hooks
import { getRandomBackgroundColor } from "@/plane-web/helpers/issue-type.helper";
import { useIssueTypes } from "@/plane-web/hooks/store";
// plane web types
import { TIssueType } from "@/plane-web/types";
// plane web helpers

type Props = {
  isModalOpen: boolean;
  handleModalClose: () => void;
};

export const defaultIssueTypeData: Partial<TIssueType> = {
  id: undefined,
  name: "",
  description: "",
};

export const CreateIssueTypeModal: FC<Props> = (props) => {
  const { isModalOpen, handleModalClose } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [issueTypeFormData, setIssueTypeFormData] = useState<Partial<TIssueType>>(defaultIssueTypeData);
  // store hooks
  const { createType } = useIssueTypes();

  useEffect(() => {
    if (isModalOpen) {
      setIssueTypeFormData({
        ...defaultIssueTypeData,
        logo_props: {
          in_use: "icon",
          icon: {
            name: getRandomIconName(),
            color: "#ffffff",
            background_color: getRandomBackgroundColor(),
          },
        },
      });
    }
  }, [isModalOpen]);

  // handlers
  const handleFormDataChange = <T extends keyof TIssueType>(key: T, value: TIssueType[T]) =>
    setIssueTypeFormData((prev) => ({ ...prev, [key]: value }));

  const handleModalClearAndClose = () => {
    setIssueTypeFormData(defaultIssueTypeData);
    handleModalClose();
  };

  const handleFormSubmit = async () => {
    setIsSubmitting(true);
    await createType(issueTypeFormData)
      .then(() => {
        handleModalClearAndClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Issue type created successfully.`,
        });
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: `Failed to create issue type. Please try again!`,
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
      handleClose={handleModalClearAndClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
    >
      <CreateOrUpdateIssueTypeForm
        formData={issueTypeFormData}
        isSubmitting={isSubmitting}
        handleFormDataChange={handleFormDataChange}
        handleModalClose={handleModalClearAndClose}
        handleFormSubmit={handleFormSubmit}
      />
    </ModalCore>
  );
};
