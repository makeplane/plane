/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import type { UseFormRegister, UseFormSetFocus } from "react-hook-form";
import { lazy, Suspense, useEffect, useRef } from "react";
// plane imports
import { useOutsideClickDetector } from "@plane/hooks";
import { EIssueLayoutTypes } from "@plane/types";
import type { IProject, TIssue } from "@plane/types";
// components
import type { TQuickAddIssueForm } from "@/components/issues/issue-layouts/quick-add";
// hooks
import useKeypress from "@/hooks/use-keypress";

const ListQuickAddIssueForm = lazy(() =>
  import("./list").then((module) => ({
    default: module.ListQuickAddIssueForm,
  }))
);
const KanbanQuickAddIssueForm = lazy(() =>
  import("./kanban").then((module) => ({
    default: module.KanbanQuickAddIssueForm,
  }))
);
const CalendarQuickAddIssueForm = lazy(() =>
  import("./calendar").then((module) => ({
    default: module.CalendarQuickAddIssueForm,
  }))
);
const TimelineQuickAddWorkItemForm = lazy(() =>
  import("./timeline").then((module) => ({
    default: module.TimelineQuickAddWorkItemForm,
  }))
);
const SpreadsheetQuickAddIssueForm = lazy(() =>
  import("./spreadsheet").then((module) => ({
    default: module.SpreadsheetQuickAddIssueForm,
  }))
);

const QUICK_ADD_ISSUE_FORMS: Record<
  EIssueLayoutTypes,
  React.LazyExoticComponent<React.ComponentType<TQuickAddIssueForm>>
> = {
  [EIssueLayoutTypes.LIST]: ListQuickAddIssueForm,
  [EIssueLayoutTypes.KANBAN]: KanbanQuickAddIssueForm,
  [EIssueLayoutTypes.CALENDAR]: CalendarQuickAddIssueForm,
  [EIssueLayoutTypes.GANTT]: TimelineQuickAddWorkItemForm,
  [EIssueLayoutTypes.SPREADSHEET]: SpreadsheetQuickAddIssueForm,
};

export type TQuickAddIssueFormRoot = {
  layout: EIssueLayoutTypes;
  projectDetail?: IProject;
  hasError?: boolean;
  setFocus: UseFormSetFocus<TIssue>;
  register: UseFormRegister<TIssue>;
  onSubmit: () => void;
  onClose: () => void;
  isEpic?: boolean;
};

export const QuickAddIssueFormRoot = observer(function QuickAddIssueFormRoot(props: TQuickAddIssueFormRoot) {
  const { layout, projectDetail, hasError = false, setFocus, register, onSubmit, onClose, isEpic = false } = props;
  // refs
  const ref = useRef<HTMLFormElement>(null);
  // click detection
  useKeypress("Escape", onClose);
  useOutsideClickDetector(ref, onClose);
  // set focus on name input
  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  const CurrentLayoutQuickAddIssueForm = QUICK_ADD_ISSUE_FORMS[layout] ?? null;

  if (!CurrentLayoutQuickAddIssueForm || !projectDetail) return <></>;
  return (
    <Suspense fallback={<></>}>
      <CurrentLayoutQuickAddIssueForm
        ref={ref}
        isOpen={true}
        projectDetail={projectDetail}
        hasError={hasError}
        register={register}
        onSubmit={onSubmit}
        isEpic={isEpic}
      />
    </Suspense>
  );
});
