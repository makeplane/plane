import { FC, useEffect, useRef } from "react";
import { observer } from "mobx-react";
import { UseFormRegister, UseFormSetFocus } from "react-hook-form";
// plane helpers
import { useOutsideClickDetector } from "@plane/helpers";
// types
import { TIssue } from "@plane/types";
// components
import {
  CalendarQuickAddIssueForm,
  GanttQuickAddIssueForm,
  KanbanQuickAddIssueForm,
  ListQuickAddIssueForm,
  SpreadsheetQuickAddIssueForm,
  TQuickAddIssueForm,
} from "@/components/issues/issue-layouts";
// constants
import { EIssueLayoutTypes } from "@/constants/issue";
// hooks
import { useProject } from "@/hooks/store";
import useKeypress from "@/hooks/use-keypress";

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
  const { isOpen, layout, projectId, hasError = false, setFocus, register, onSubmit, onClose } = props;
  // store hooks
  const { getProjectById } = useProject();
  // derived values
  const projectDetail = getProjectById(projectId);
  // refs
  const ref = useRef<HTMLFormElement>(null);
  // click detection
  useKeypress("Escape", onClose);
  useOutsideClickDetector(ref, onClose);
  // set focus on name input
  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  if (!projectDetail) return <></>;

  const QUICK_ADD_ISSUE_FORMS: Record<EIssueLayoutTypes, FC<TQuickAddIssueForm>> = {
    [EIssueLayoutTypes.LIST]: ListQuickAddIssueForm,
    [EIssueLayoutTypes.KANBAN]: KanbanQuickAddIssueForm,
    [EIssueLayoutTypes.CALENDAR]: CalendarQuickAddIssueForm,
    [EIssueLayoutTypes.GANTT]: GanttQuickAddIssueForm,
    [EIssueLayoutTypes.SPREADSHEET]: SpreadsheetQuickAddIssueForm,
  };

  const CurrentLayoutQuickAddIssueForm = QUICK_ADD_ISSUE_FORMS[layout] ?? null;

  if (!CurrentLayoutQuickAddIssueForm) return <></>;

  return (
    <CurrentLayoutQuickAddIssueForm
      ref={ref}
      isOpen={isOpen}
      projectDetail={projectDetail}
      hasError={hasError}
      register={register}
      onSubmit={onSubmit}
    />
  );
});
