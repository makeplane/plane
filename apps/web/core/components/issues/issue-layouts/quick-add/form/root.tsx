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
// plane types
import { useOutsideClickDetector } from "@plane/hooks";
import { EIssueLayoutTypes } from "@plane/types";
import type { TIssue } from "@plane/types";
// components
import type { TQuickAddIssueForm } from "@/components/issues/issue-layouts/quick-add";
// hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
import { useProject } from "@/hooks/store/use-project";
import useKeypress from "@/hooks/use-keypress";

const CreateUpdateWorkItemModal = lazy(() =>
  import("@/components/issues/issue-modal/root").then((module) => ({
    default: module.CreateUpdateIssueModal,
  }))
);
const CreateUpdateEpicModal = lazy(() =>
  import("@/components/epics/epic-modal").then((module) => ({
    default: module.CreateUpdateEpicModal,
  }))
);
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

export const QuickAddIssueFormRoot = observer(function QuickAddIssueFormRoot(props: TQuickAddIssueFormRoot) {
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
  // refs
  const ref = useRef<HTMLFormElement>(null);
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectDefaultIssueType, getProjectEpicDetails } = useIssueTypes();
  // derived values
  const projectDetail = getProjectById(projectId);
  const defaultIssueType = getProjectDefaultIssueType(projectId);
  const projectEpics = getProjectEpicDetails(projectId);
  const activeProperties = isEpic ? projectEpics?.activeProperties : defaultIssueType?.activeProperties;
  const mandatoryFields = activeProperties?.filter((property) => property.is_required) ?? [];
  const CurrentLayoutQuickAddIssueForm = QUICK_ADD_ISSUE_FORMS[layout] ?? null;

  // click detection
  useKeypress("Escape", onClose);
  useOutsideClickDetector(ref, onClose);

  // set focus on name input
  useEffect(() => {
    setFocus("name");
  }, [setFocus]);

  if (mandatoryFields.length > 0) {
    return (
      <>
        {isEpic ? (
          <CreateUpdateEpicModal isOpen={isOpen} onClose={onClose} data={prePopulatedData} />
        ) : (
          <CreateUpdateWorkItemModal isOpen={isOpen} onClose={onClose} data={prePopulatedData} />
        )}
      </>
    );
  }

  if (!CurrentLayoutQuickAddIssueForm || !projectDetail) return <></>;
  return (
    <Suspense fallback={<></>}>
      <CurrentLayoutQuickAddIssueForm
        ref={ref}
        isOpen={isOpen}
        projectDetail={projectDetail}
        hasError={hasError}
        register={register}
        onSubmit={onSubmit}
        isEpic={isEpic}
      />
    </Suspense>
  );
});
