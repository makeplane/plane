import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
// ui
import { EModalPosition, EModalWidth, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { getRandomIconName } from "@/helpers/emoji.helper";
// plane web components
import { CreateOrUpdateIssueTypeForm } from "@/plane-web/components/issue-types/";
// plane web helpers
import { getRandomBackgroundColor } from "@/plane-web/helpers/issue-type.helper";
// plane web
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
// plane web types
import { TIssueType } from "@/plane-web/types";

type Props = {
  issueTypeId: string | null;
  isModalOpen: boolean;
  handleModalClose: () => void;
};

const defaultIssueTypeData: Partial<TIssueType> = {
  id: undefined,
  name: "",
  description: "",
};

export const CreateOrUpdateIssueTypeModal: FC<Props> = observer((props) => {
  const { issueTypeId, isModalOpen, handleModalClose } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [issueTypeFormData, setIssueTypeFormData] = useState<Partial<TIssueType> | undefined>(undefined);
  // store hooks
  const { createType } = useIssueTypes();
  const issueType = useIssueType(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;

  useEffect(() => {
    if (isModalOpen) {
      if (issueTypeDetail) {
        setIssueTypeFormData(issueTypeDetail);
      } else {
        setIssueTypeFormData({
          ...defaultIssueTypeData,
          logo_props: {
            in_use: "icon",
            icon: {
              name: getRandomIconName(),
              background_color: getRandomBackgroundColor(),
            },
          },
        });
      }
    }
  }, [issueTypeDetail, isModalOpen]);

  // handlers
  const handleFormDataChange = <T extends keyof TIssueType>(key: T, value: TIssueType[T]) =>
    setIssueTypeFormData((prev) => ({ ...prev, [key]: value }));

  const handleModalClearAndClose = () => {
    setIssueTypeFormData(defaultIssueTypeData);
    handleModalClose();
  };

  const handleCreateIssueType = async () => {
    if (!issueTypeFormData) return;
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
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to create issue type. Please try again!`,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleUpdateIssueType = async () => {
    if (!issueTypeFormData) return;

    setIsSubmitting(true);
    await issueType
      ?.updateType(issueTypeFormData)
      .then(() => {
        handleModalClearAndClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Issue type ${issueTypeFormData?.name} updated successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to update issue type. Please try again!`,
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
        formData={issueTypeFormData ?? defaultIssueTypeData}
        isSubmitting={isSubmitting}
        handleFormDataChange={handleFormDataChange}
        handleModalClose={handleModalClearAndClose}
        handleFormSubmit={issueTypeId ? handleUpdateIssueType : handleCreateIssueType}
      />
    </ModalCore>
  );
});
