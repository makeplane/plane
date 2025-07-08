import { FC } from "react";
import { observer } from "mobx-react";
import { UseFormRegister, UseFormSetFocus } from "react-hook-form";
// plane constants
import { EIssueLayoutTypes } from "@plane/constants";
// types
import { TIssue } from "@plane/types";
// hooks
import { QuickAddIssueFormRoot as BaseQuickAddIssueFormRoot } from "@/ce/components/issues/quick-add/";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
// plane web imports
import { CreateUpdateEpicModal } from "@/plane-web/components/epics/epic-modal";
import { useIssueTypes } from "@/plane-web/hooks/store";

export type TQuickAddIssueFormRoot = {
  isOpen: boolean;
  layout: EIssueLayoutTypes;
  prePopulatedData?: Partial<TIssue>;
  projectId: string;
  hasError?: boolean;
  setFocus: UseFormSetFocus<TIssue>;
  register: UseFormRegister<TIssue>;
  onSubmit: () => void;
  onClose: () => void;
  isEpic?: boolean;
};

export const QuickAddIssueFormRoot: FC<TQuickAddIssueFormRoot> = observer((props) => {
  const {
    isOpen,
    layout,
    prePopulatedData,
    projectId,
    hasError = false,
    setFocus,
    register,
    onSubmit,
    onClose,
    isEpic = false,
  } = props;
  // store hooks
  const { getProjectDefaultIssueType, getProjectEpicDetails } = useIssueTypes();
  // derived values
  const defaultIssueType = getProjectDefaultIssueType(projectId);
  const projectEpics = getProjectEpicDetails(projectId);
  const activeProperties = isEpic ? projectEpics?.activeProperties : defaultIssueType?.activeProperties;
  const mandatoryFields = activeProperties?.filter((property) => property.is_required) ?? [];

  return (
    <>
      {mandatoryFields.length > 0 ? (
        <>
          {isEpic ? (
            <CreateUpdateEpicModal isOpen={isOpen} onClose={onClose} data={prePopulatedData} />
          ) : (
            <CreateUpdateIssueModal isOpen={isOpen} onClose={onClose} data={prePopulatedData} />
          )}
        </>
      ) : (
        <BaseQuickAddIssueFormRoot
          isOpen={isOpen}
          layout={layout}
          projectId={projectId}
          hasError={hasError}
          setFocus={setFocus}
          register={register}
          onSubmit={onSubmit}
          onClose={onClose}
          isEpic={isEpic}
        />
      )}
    </>
  );
});
