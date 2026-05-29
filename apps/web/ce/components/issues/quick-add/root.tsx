import type { FC } from "react";
import { useEffect, useRef } from "react";
import { observer } from "mobx-react";
import type { UseFormRegister, UseFormSetFocus } from "react-hook-form";
// plane constants
// plane helpers
import { useOutsideClickDetector } from "@plane/hooks";
// types
import type { TIssue } from "@plane/types";
import { EIssueLayoutTypes } from "@plane/types";
// components
import type { TQuickAddIssueForm } from "@/components/issues/issue-layouts/quick-add";
import {
  CalendarQuickAddIssueForm,
  GanttQuickAddIssueForm,
  KanbanQuickAddIssueForm,
  ListQuickAddIssueForm,
  SpreadsheetQuickAddIssueForm,
} from "@/components/issues/issue-layouts/quick-add";
// hooks
import { useProject } from "@/hooks/store/use-project";
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
  isEpic: boolean;
};

export const QuickAddIssueFormRoot = observer(function QuickAddIssueFormRoot(props: TQuickAddIssueFormRoot) {
  const { isOpen, layout, projectId, hasError = false, setFocus, register, onSubmit, onClose, isEpic } = props;
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
      isEpic={isEpic}
    />
  );
});
