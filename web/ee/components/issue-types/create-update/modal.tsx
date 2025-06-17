import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
// ui
import { useTranslation } from "@plane/i18n";
import { TIssueType } from "@plane/types";
import { EModalPosition, EModalWidth, getRandomIconName, ModalCore, setToast, TOAST_TYPE } from "@plane/ui";
// helpers
import { getRandomBackgroundColor } from "@plane/utils";
// plane web components
import { CreateOrUpdateIssueTypeForm } from "@/plane-web/components/issue-types/";
// plane web
import { useIssueType, useIssueTypes } from "@/plane-web/hooks/store";
// plane imports

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
  // plane hooks
  const { t } = useTranslation();
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
          title: t("work_item_types.create.toast.success.title"),
          message: t("work_item_types.create.toast.success.message"),
        });
      })
      .catch((error) => {
        if (error.code === "ISSUE_TYPE_ALREADY_EXIST") {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("work_item_types.create.toast.error.title"),
            message: t("work_item_types.create.toast.error.message.conflict", { name: issueTypeFormData?.name }),
          });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("work_item_types.create.toast.error.title"),
            message: t("work_item_types.create.toast.error.message.default"),
          });
        }
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
          title: t("work_item_types.update.toast.success.title"),
          message: t("work_item_types.update.toast.success.message", { name: issueTypeFormData?.name }),
        });
      })
      .catch((error) => {
        if (error.code === "ISSUE_TYPE_ALREADY_EXIST") {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("work_item_types.update.toast.error.title"),
            message: t("work_item_types.update.toast.error.message.conflict", { name: issueTypeFormData?.name }),
          });
        } else {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("work_item_types.update.toast.error.title"),
            message: t("work_item_types.update.toast.error.message.default"),
          });
        }
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
