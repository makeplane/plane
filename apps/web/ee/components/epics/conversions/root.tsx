"use client";

import { FC } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane imports
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { EIssueServiceType, EIssuesStoreType, EWorkItemConversionType } from "@plane/types";
import { AlertModalCore, EModalPosition, EModalWidth } from "@plane/ui";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
// hooks
import { useIssueDetail, useUserPermissions } from "@/hooks/store";
// local imports
import { useIssueTypes } from "@/plane-web/hooks/store";
import { useProjectAdvanced } from "@/plane-web/hooks/store/projects/use-projects";
import { CreateUpdateEpicModal } from "../epic-modal";
import { ConvertWorkItemIcon } from "./icon";

type Props = {
  workItemId: string;
  conversionType: EWorkItemConversionType;
  disabled?: boolean;
};

export const ConvertWorkItemAction: FC<Props> = observer((props) => {
  const { workItemId, conversionType, disabled = false } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // hooks
  const {
    issue: { getIssueById: getEpicById },
    isEpicToWorkItemModalOpen,
    toggleEpicToWorkItemModal,
    setPeekIssue: setEpicPeek,
  } = useIssueDetail(EIssueServiceType.EPICS);
  const {
    issue: { getIssueById },
    isWorkItemToEpicModalOpen,
    toggleWorkItemToEpicModal,
    isConversionWarningModalOpen,
    toggleConversionWarningModal,
    setPeekIssue,
  } = useIssueDetail();
  const { getProjectFeatures } = useProjectAdvanced();
  const { getProjectDefaultIssueType, getProjectEpicId } = useIssueTypes();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const issue =
    conversionType === EWorkItemConversionType.WORK_ITEM ? getEpicById(workItemId) : getIssueById(workItemId);
  const projectId = issue?.project_id;
  const projectFeatures = projectId ? getProjectFeatures(projectId) : undefined;
  const isEpicsEnabled = projectFeatures?.is_epic_enabled;
  const defaultIssueType = projectId ? getProjectDefaultIssueType(projectId) : undefined;
  const defaultEpicId = projectId ? getProjectEpicId(projectId) : undefined;

  const handleClose = () => {
    if (conversionType === EWorkItemConversionType.WORK_ITEM) toggleEpicToWorkItemModal(null);
    else toggleWorkItemToEpicModal(null);
    setPeekIssue(undefined);
    setEpicPeek(undefined);
  };
  const handleConvert = () => {
    if (conversionType === EWorkItemConversionType.WORK_ITEM) toggleEpicToWorkItemModal(workItemId);
    else toggleWorkItemToEpicModal(workItemId);
    toggleConversionWarningModal(null);
  };

  const handleOnClick = () => {
    if (conversionType === EWorkItemConversionType.WORK_ITEM) handleConvert();
    else toggleConversionWarningModal(workItemId);
  };

  const isEditable = allowPermissions(
    [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
    EUserPermissionsLevel.PROJECT,
    workspaceSlug?.toString(),
    projectId?.toString()
  );

  if (!isEpicsEnabled) return null;

  return (
    <>
      <ConvertWorkItemIcon
        conversionType={conversionType}
        handleOnClick={handleOnClick}
        disabled={!isEditable || disabled}
      />

      {isConversionWarningModalOpen === workItemId && conversionType === EWorkItemConversionType.EPIC && (
        <AlertModalCore
          isOpen={!!isConversionWarningModalOpen}
          handleClose={() => toggleConversionWarningModal(null)}
          handleSubmit={handleConvert}
          isSubmitting={false}
          title="Convert this work item to epic?"
          content="This will detach any associated cycles, modules, and parent items connected to it."
          primaryButtonText={{
            default: "Continue",
            loading: "Loading",
          }}
          variant="primary"
          secondaryButtonText="Cancel"
          width={EModalWidth.LG}
          position={EModalPosition.TOP}
        />
      )}

      {issue && isEpicToWorkItemModalOpen === workItemId && conversionType === EWorkItemConversionType.WORK_ITEM && (
        <CreateUpdateIssueModal
          isOpen={!!isEpicToWorkItemModalOpen}
          onClose={handleClose}
          storeType={EIssuesStoreType.PROJECT}
          data={{
            ...issue,
            is_epic: false,
            type_id: defaultIssueType?.id,
          }}
          isProjectSelectionDisabled
          fetchIssueDetails={false}
          primaryButtonText={{
            default: "Convert to work item",
            loading: "Converting",
          }}
          withDraftIssueWrapper={false}
          isConversionOperation
        />
      )}
      {issue && isWorkItemToEpicModalOpen === workItemId && conversionType === EWorkItemConversionType.EPIC && (
        <CreateUpdateEpicModal
          isOpen={!!isWorkItemToEpicModalOpen}
          onClose={handleClose}
          data={{
            ...issue,
            is_epic: true,
            type_id: defaultEpicId,
          }}
          isProjectSelectionDisabled
          fetchIssueDetails={false}
          isConversionOperation
          primaryButtonText={{
            default: "Convert to epic",
            loading: "Converting",
          }}
        />
      )}
    </>
  );
});
