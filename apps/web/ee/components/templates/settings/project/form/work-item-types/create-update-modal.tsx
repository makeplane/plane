import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuePropertyType, IIssueProperty, IIssueType, TIssueType } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore, getRandomIconName } from "@plane/ui";
import {
  getRandomBackgroundColor,
  mockCreateCustomProperty,
  mockCreateCustomPropertyOption,
  mockCreateWorkItemType,
  mockDeleteCustomProperty,
  mockDeleteCustomPropertyOption,
  mockUpdateCustomProperty,
  mockUpdateWorkItemType,
} from "@plane/utils";
// plane web imports
import { rootStore } from "@/lib/store-context";
import { CreateOrUpdateIssueTypeForm } from "@/plane-web/components/issue-types/create-update/form";
import { IssuePropertyOption } from "@/plane-web/store/issue-types/issue-property-option";
import { IssueType } from "@/plane-web/store/issue-types/issue-type";

type Props = {
  workspaceSlug: string;
  projectTemplateId: string | undefined;
  workItemTypeId: string | null;
  isModalOpen: boolean;
  handleWorkItemTypeListUpdate: (workItemType: IIssueType) => void;
  handleModalClose: () => void;
  getWorkItemTypeById: (workItemTypeId: string) => IIssueType | undefined;
  getCustomPropertyById: (customPropertyId: string) => IIssueProperty<EIssuePropertyType> | undefined;
};

const defaultIssueTypeData: Partial<TIssueType> = {
  id: undefined,
  name: "",
  description: "",
  is_active: true,
  is_default: false,
  level: 0,
  is_epic: false,
};

export const ProjectTemplateWorkItemTypeModal: FC<Props> = observer((props) => {
  const {
    workspaceSlug,
    projectTemplateId,
    workItemTypeId,
    isModalOpen,
    handleWorkItemTypeListUpdate,
    handleModalClose,
    getWorkItemTypeById,
    getCustomPropertyById,
  } = props;
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [issueTypeFormData, setIssueTypeFormData] = useState<Partial<TIssueType> | undefined>(undefined);
  // store hooks
  const issueType = workItemTypeId ? getWorkItemTypeById(workItemTypeId) : undefined;
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

    await mockCreateWorkItemType({
      // Passing projectTemplateId, just in case we need any reference to the project template.
      // Empty string while creation
      workspaceSlug,
      projectId: projectTemplateId ?? "",
      data: issueTypeFormData,
    })
      .then((workItemType) => {
        handleWorkItemTypeListUpdate(
          new IssueType({
            root: rootStore,
            services: {
              workItemType: {
                create: mockCreateWorkItemType,
                update: (payload) => mockUpdateWorkItemType(getWorkItemTypeById, payload),
              },
              customProperty: {
                create: mockCreateCustomProperty,
                update: (payload) =>
                  mockUpdateCustomProperty(
                    getCustomPropertyById,
                    (option) => new IssuePropertyOption(rootStore, option),
                    payload
                  ),
                deleteProperty: mockDeleteCustomProperty,
              },
              customPropertyOption: {
                create: mockCreateCustomPropertyOption,
                deleteOption: mockDeleteCustomPropertyOption,
              },
            },
            issueTypeData: workItemType,
          })
        );
        handleModalClearAndClose();
      })
      .catch((error) => {
        console.error(error?.error);
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
      })
      .catch((error) => {
        console.error(error?.error);
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
        handleFormSubmit={workItemTypeId ? handleUpdateIssueType : handleCreateIssueType}
      />
    </ModalCore>
  );
});
