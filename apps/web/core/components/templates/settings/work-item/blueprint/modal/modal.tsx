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

import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { FormProvider, useForm } from "react-hook-form";
import { v4 as uuidv4 } from "uuid";
// plane imports
import type { TIssuePropertyValues, TWorkItemBlueprintFormData } from "@plane/types";
import { EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// plane web imports
import { useIssueModal } from "@/hooks/context/use-issue-modal";
import { useProjectState } from "@/hooks/store/use-project-state";
import { IssueModalProvider } from "@/components/issues/issue-modal/context/provider";
// local imports
import { useIssueTypes } from "@/plane-web/hooks/store";
import type { TCreateUpdateWorkItemBlueprintFormProps } from "./form";
import { CreateUpdateWorkItemBlueprintForm, DEFAULT_WORK_ITEM_BLUEPRINT_FORM_VALUES } from "./form";

type TCreateUpdateWorkItemBlueprintWithMobxData = {
  usePropsForAdditionalData: false;
};

type TCreateUpdateWorkItemBlueprintWithPropsData = {
  usePropsForAdditionalData: true;
  getProjectDefaultStateId: (projectId: string) => string | undefined;
  getProjectDefaultWorkItemTypeId: (projectId: string) => string | undefined;
};

type TCreateUpdateWorkItemBlueprintModalProps = TCreateUpdateWorkItemBlueprintFormProps & {
  isOpen: boolean;
  dataForPreload?: Partial<TWorkItemBlueprintFormData> | null;
  customPropertyValuesForPreload?: TIssuePropertyValues | null;
} & (TCreateUpdateWorkItemBlueprintWithMobxData | TCreateUpdateWorkItemBlueprintWithPropsData);

export const CreateUpdateWorkItemBlueprintModal = observer(function CreateUpdateWorkItemBlueprintModal(
  props: TCreateUpdateWorkItemBlueprintModalProps
) {
  if (!props.isOpen) return null;
  return (
    <IssueModalProvider>
      <CreateUpdateWorkItemBlueprintModalBase {...props} />
    </IssueModalProvider>
  );
});

const CreateUpdateWorkItemBlueprintModalBase = observer(function CreateUpdateWorkItemBlueprintModalBase(
  props: TCreateUpdateWorkItemBlueprintModalProps
) {
  const { isOpen, customPropertyValuesForPreload, dataForPreload, projectId, usePropsForAdditionalData } = props;
  // store hooks
  const { getProjectDefaultWorkItemTypeId: getProjectDefaultWorkItemTypeIdFromStore } = useIssueTypes();
  const { getProjectDefaultStateId: getProjectDefaultStateIdFromStore } = useProjectState();
  // context hooks
  const { setIssuePropertyValues } = useIssueModal();
  // derived values
  const getProjectDefaultStateId = usePropsForAdditionalData
    ? props.getProjectDefaultStateId
    : getProjectDefaultStateIdFromStore;
  const getProjectDefaultWorkItemTypeId = usePropsForAdditionalData
    ? props.getProjectDefaultWorkItemTypeId
    : getProjectDefaultWorkItemTypeIdFromStore;
  const defaultValueForReset = useMemo(() => {
    // Get default state id and issue type id for the project
    const defaultStateId = projectId ? getProjectDefaultStateId(projectId) : undefined;
    const defaultIssueTypeId = projectId ? getProjectDefaultWorkItemTypeId(projectId) : undefined;
    // Common default values for the form
    const defaultValue = {
      ...DEFAULT_WORK_ITEM_BLUEPRINT_FORM_VALUES,
      id: uuidv4(),
      project_id: projectId,
      state_id: defaultStateId,
      type_id: defaultIssueTypeId,
    };
    // Return the default value based on the preloaded data
    return dataForPreload
      ? { ...defaultValue, ...dataForPreload, project_id: dataForPreload.project_id ?? projectId }
      : defaultValue;
  }, [dataForPreload, getProjectDefaultStateId, getProjectDefaultWorkItemTypeId, projectId]);
  // form state
  const methods = useForm<TWorkItemBlueprintFormData>({
    defaultValues: defaultValueForReset,
  });

  useEffect(() => {
    if (isOpen) {
      methods.reset(defaultValueForReset);
      setIssuePropertyValues(customPropertyValuesForPreload ?? {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return (
    <ModalCore
      isOpen={isOpen}
      position={EModalPosition.TOP}
      width={EModalWidth.XXXXL}
      className="rounded-lg shadow-none transition-[width] ease-linear"
    >
      <FormProvider {...methods}>
        <CreateUpdateWorkItemBlueprintForm {...props} />
      </FormProvider>
    </ModalCore>
  );
});
