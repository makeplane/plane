import { FC } from "react";
import { observer } from "mobx-react";
import { UseFormRegister, UseFormSetFocus } from "react-hook-form";
// types
import { TIssue } from "@plane/types";
// hooks
import { QuickAddIssueFormRoot as BaseQuickAddIssueFormRoot } from "@/ce/components/issues/quick-add/";
// components
import { CreateUpdateIssueModal } from "@/components/issues";
// constants
import { EIssueLayoutTypes } from "@/constants/issue";
// plane web hooks
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
  } = props;
  // store hooks
  const { getProjectDefaultIssueType } = useIssueTypes();
  // derived values
  const defaultIssueType = getProjectDefaultIssueType(projectId);
  const mandatoryFields = defaultIssueType?.activeProperties.filter((property) => property.is_required) ?? [];

  return (
    <>
      {mandatoryFields.length > 0 ? (
        <CreateUpdateIssueModal isOpen={isOpen} onClose={onClose} data={prePopulatedData} />
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
        />
      )}
    </>
  );
});
