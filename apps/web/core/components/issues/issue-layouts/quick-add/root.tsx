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

import type { FC } from "react";
import { lazy, Suspense, useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import type { UseFormRegister } from "react-hook-form";
import { useForm } from "react-hook-form";
// plane imports
import { useTranslation } from "@plane/i18n";
import { PlusIcon } from "lucide-react";
import { setPromiseToast } from "@plane/propel/toast";
import type { IProject, TIssue, EIssueLayoutTypes, TIssueGroupByOptions } from "@plane/types";
import { cn, createIssuePayload, getMandatoryFields, resolveQuickAddCreationContext } from "@plane/utils";
// hooks
import { useIssueTypes } from "@/plane-web/hooks/store";
import { useProject } from "@/hooks/store/use-project";
import { useWorkflows } from "@/hooks/store/use-workflows";
// local imports
import { QuickAddIssueFormRoot } from "./form/root";
import { CreateIssueToastActionItems } from "../../create-issue-toast-action-items";

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

export type TQuickAddIssueForm = {
  ref: React.RefObject<HTMLFormElement>;
  isOpen: boolean;
  projectDetail: IProject;
  hasError: boolean;
  register: UseFormRegister<TIssue>;
  onSubmit: () => void;
  isEpic: boolean;
};

export type TQuickAddIssueButton = {
  isEpic?: boolean;
  onClick: () => void;
};

type TQuickAddIssueRoot = {
  isQuickAddOpen?: boolean;
  layout: EIssueLayoutTypes;
  prePopulatedData?: Partial<TIssue>;
  QuickAddButton?: FC<TQuickAddIssueButton>;
  customQuickAddButton?: React.ReactNode;
  containerClassName?: string;
  setIsQuickAddOpen?: (isOpen: boolean) => void;
  quickAddCallback?: (projectId: string | null | undefined, data: TIssue) => Promise<TIssue | undefined>;
  isEpic?: boolean;
  groupBy?: TIssueGroupByOptions;
  subGroupBy?: TIssueGroupByOptions;
};

const defaultValues: Partial<TIssue> = {
  name: "",
};

export const QuickAddIssueRoot = observer(function QuickAddIssueRoot(props: TQuickAddIssueRoot) {
  const {
    isQuickAddOpen,
    layout,
    prePopulatedData,
    QuickAddButton,
    customQuickAddButton,
    containerClassName = "",
    setIsQuickAddOpen,
    quickAddCallback,
    isEpic = false,
    groupBy = null,
    subGroupBy = null,
  } = props;
  // i18n
  const { t } = useTranslation();
  // router
  const { workspaceSlug, projectId } = useParams();
  // states
  const [isOpen, setIsOpen] = useState(isQuickAddOpen ?? false);
  // form info
  const {
    reset,
    handleSubmit,
    setFocus,
    register,
    formState: { errors, isSubmitting },
  } = useForm<TIssue>({ defaultValues });
  // store hooks
  const { getProjectById } = useProject();
  const { getProjectDefaultIssueType, getProjectEpicDetails, getIssueTypeById, isWorkItemTypeEnabledForProject } =
    useIssueTypes();
  const {
    getCreationTypeForState,
    isStateCreationAllowedForType,
    getFirstCreationAllowedStateForType,
    isWorkflowsEnabled,
  } = useWorkflows();
  // derived values — resolution logic (runs always, controls both button and form visibility)
  const projectDetail = projectId ? getProjectById(projectId.toString()) : undefined;
  const isWorkItemTypeEnabled =
    workspaceSlug && projectId
      ? isWorkItemTypeEnabledForProject(workspaceSlug.toString(), projectId.toString())
      : false;
  const workflowsEnabled = workspaceSlug && projectId ? isWorkflowsEnabled(workspaceSlug, projectId) : false;
  const defaultIssueType = projectId ? getProjectDefaultIssueType(projectId.toString()) : undefined;
  const projectEpics = projectId ? getProjectEpicDetails(projectId.toString()) : undefined;
  const defaultIssueTypeId = defaultIssueType?.id;
  const isTypeActive = (typeId: string) => Boolean(getIssueTypeById(typeId)?.is_active);
  const { creationTypeId, modalData, resolvedPrePopulatedData, shouldHideQuickAdd, shouldUseModalWithFallbackType } =
    resolveQuickAddCreationContext({
      isEpic,
      prePopulatedData,
      defaultIssueTypeId,
      workflowsEnabled,
      getCreationTypeForState,
      projectId: projectId?.toString() ?? "",
      isWorkItemTypeEnabled,
      groupBy,
      subGroupBy,
      isStateCreationAllowedForType,
      getFirstCreationAllowedStateForType,
      isTypeActive,
    });
  const selectedIssueType = creationTypeId ? getIssueTypeById(creationTypeId) : defaultIssueType;
  const activeProperties = isEpic ? projectEpics?.activeProperties : selectedIssueType?.activeProperties;
  const mandatoryFields = getMandatoryFields({ activeProperties });
  const shouldUseModal = shouldUseModalWithFallbackType || mandatoryFields.length > 0;

  useEffect(() => {
    if (isQuickAddOpen !== undefined) {
      setIsOpen(isQuickAddOpen);
    }
  }, [isQuickAddOpen]);

  useEffect(() => {
    if (!isOpen) reset({ ...defaultValues });
  }, [isOpen, reset]);

  const handleIsOpen = (isOpen: boolean) => {
    if (isQuickAddOpen !== undefined && setIsQuickAddOpen) {
      setIsQuickAddOpen(isOpen);
    } else {
      setIsOpen(isOpen);
    }
  };

  const onSubmitHandler = async (formData: TIssue) => {
    if (isSubmitting || !workspaceSlug || !projectId) return;

    reset({ ...defaultValues });

    const payload = createIssuePayload(projectId.toString(), {
      ...(resolvedPrePopulatedData ?? {}),
      ...formData,
    });

    if (quickAddCallback) {
      const quickAddPromise = quickAddCallback(projectId.toString(), { ...payload });
      setPromiseToast<any>(quickAddPromise, {
        loading: isEpic ? t("epic.adding") : t("issue.adding"),
        success: {
          title: t("common.success"),
          message: () => undefined,
          actionItems: (data) => (
            <CreateIssueToastActionItems
              workspaceSlug={workspaceSlug.toString()}
              projectId={projectId.toString()}
              issueId={data.id}
              isEpic={isEpic}
            />
          ),
        },
        error: {
          title: t("common.error.label"),
          message: (err) => err?.message || t("common.error.message"),
        },
      });

      await quickAddPromise;
    }
  };

  if (!projectId || shouldHideQuickAdd) return null;

  return (
    <div
      className={cn(
        containerClassName,
        errors && errors?.name && errors?.name?.message ? `border-danger-strong bg-danger-subtle` : ``
      )}
    >
      {isOpen ? (
        shouldUseModal ? (
          <Suspense fallback={<></>}>
            {isEpic ? (
              <CreateUpdateEpicModal isOpen={isOpen} onClose={() => handleIsOpen(false)} data={modalData} />
            ) : (
              <CreateUpdateWorkItemModal isOpen={isOpen} onClose={() => handleIsOpen(false)} data={modalData} />
            )}
          </Suspense>
        ) : (
          <QuickAddIssueFormRoot
            layout={layout}
            projectDetail={projectDetail}
            hasError={errors && errors?.name && errors?.name?.message ? true : false}
            setFocus={setFocus}
            register={register}
            onSubmit={handleSubmit(onSubmitHandler)}
            onClose={() => handleIsOpen(false)}
            isEpic={isEpic}
          />
        )
      ) : (
        <>
          {QuickAddButton && <QuickAddButton isEpic={isEpic} onClick={() => handleIsOpen(true)} />}
          {customQuickAddButton && <>{customQuickAddButton}</>}
          {!QuickAddButton && !customQuickAddButton && (
            <button
              className="flex w-full cursor-pointer items-center gap-2 px-2 py-3 bg-layer-transparent hover:bg-layer-transparent-hover"
              onClick={() => handleIsOpen(true)}
            >
              <PlusIcon className="h-3.5 w-3.5 stroke-2" />
              <span className="text-13 font-medium">{t(`${isEpic ? "epic.new" : "issue.new"}`)}</span>
            </button>
          )}
        </>
      )}
    </div>
  );
});
