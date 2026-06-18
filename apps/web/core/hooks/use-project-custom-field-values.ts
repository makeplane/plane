/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
// plane imports
import { ECustomFieldEntityType } from "@plane/types";
import type { TCustomField, TCustomFieldRawValue, TCustomFieldValuePayload } from "@plane/types";
// components
import { buildCustomFieldPayload, seedCustomFieldValues, validateCustomFieldValues } from "@/components/custom-fields";
// hooks
import { useCustomField } from "@/hooks/store/use-custom-field";

type Params = {
  workspaceSlug: string;
  /** when provided, loads the project's saved values; otherwise loads active definitions (create flow) */
  projectId?: string;
  enabled?: boolean;
};

export const useProjectCustomFieldValues = (params: Params) => {
  const { workspaceSlug, projectId, enabled = true } = params;
  const { fetchActiveCustomFields, fetchProjectValues } = useCustomField();
  // local state
  const [values, setValues] = useState<Record<string, TCustomFieldRawValue>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fields, setFields] = useState<TCustomField[]>([]);

  const swrKey =
    enabled && workspaceSlug
      ? projectId
        ? `PROJECT_CF_VALUES_${workspaceSlug}_${projectId}`
        : `PROJECT_CF_ACTIVE_${workspaceSlug}`
      : null;

  const { data, isLoading, mutate } = useSWR(
    swrKey,
    swrKey
      ? () =>
          projectId
            ? fetchProjectValues(workspaceSlug, projectId)
            : fetchActiveCustomFields(workspaceSlug, ECustomFieldEntityType.PROJECT)
      : null
  );

  useEffect(() => {
    if (!data) return;
    setFields(data as TCustomField[]);
    setValues(seedCustomFieldValues(data as Array<TCustomField & { value?: TCustomFieldRawValue }>));
  }, [data]);

  const setValue = (fieldId: string, value: TCustomFieldRawValue) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const validate = (): boolean => {
    const nextErrors = validateCustomFieldValues(fields, values);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const getPayload = (): TCustomFieldValuePayload[] => buildCustomFieldPayload(values);

  const hasFields = useMemo(() => fields.length > 0, [fields]);

  return { fields, values, setValue, errors, validate, getPayload, isLoading, hasFields, mutate };
};
