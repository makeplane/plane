"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssueServiceType, EIssuesStoreType, EWorkItemConversionType } from "@plane/constants";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
// hooks
import { useIssueDetail } from "@/hooks/store";
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
    setPeekIssue,
  } = useIssueDetail();
  const { getProjectFeatures } = useProjectAdvanced();
  const { getProjectDefaultIssueType, getProjectEpicId } = useIssueTypes();

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
  const handleClick = () => {
    if (conversionType === EWorkItemConversionType.WORK_ITEM) toggleEpicToWorkItemModal(workItemId);
    else toggleWorkItemToEpicModal(workItemId);
  };

  if (!isEpicsEnabled) return null;

  return (
    <>
      <ConvertWorkItemIcon handleOnClick={handleClick} disabled={disabled} conversionType={conversionType} />

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
            loading: "Converting...",
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
            loading: "Converting...",
          }}
        />
      )}
    </>
  );
});
