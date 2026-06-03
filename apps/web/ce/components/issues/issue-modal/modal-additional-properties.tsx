/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import type { UseFormSetValue, UseFormWatch } from "react-hook-form";
import type { TIssue, TIssueCustomFields } from "@plane/types";
import { useProjectCustomFields } from "@/plane-web/hooks/use-project-custom-fields";
import {
  CustomFieldInput,
  type TCustomFieldValue,
} from "@/plane-web/components/issues/custom-fields/custom-field-input";
import { SidebarPropertyListItem } from "@/components/common/layout/sidebar/property-list-item";
import { SettingIcon } from "@/components/icons/attachment";

export type TWorkItemModalAdditionalPropertiesProps = {
  isDraft?: boolean;
  projectId: string | null;
  workItemId: string | undefined;
  workspaceSlug: string;
  watch?: UseFormWatch<TIssue>;
  setValue?: UseFormSetValue<TIssue>;
};

export const WorkItemModalAdditionalProperties = observer(function WorkItemModalAdditionalProperties(
  props: TWorkItemModalAdditionalPropertiesProps
) {
  const { projectId, workspaceSlug, watch, setValue } = props;
  const { properties, isLoading } = useProjectCustomFields(workspaceSlug, projectId ?? undefined);
  const [localFields, setLocalFields] = useState<TIssueCustomFields>({});

  const formCustomFields = watch?.("custom_fields");
  const values = formCustomFields ?? localFields;

  useEffect(() => {
    if (formCustomFields) {
      setLocalFields(formCustomFields);
    }
  }, [formCustomFields]);

  const handleChange = (key: string, value: unknown) => {
    const next = { ...values, [key]: value as TIssueCustomFields[string] };
    setLocalFields(next);
    setValue?.("custom_fields", next, { shouldDirty: true });
  };

  if (!projectId || isLoading || properties.length === 0) return null;

  return (
    <div className="space-y-2.5 px-5 pb-2">
      <h6 className="text-body-xs-medium text-tertiary">Custom fields</h6>
      {properties.map((property) => (
        <SidebarPropertyListItem key={property.id} icon={SettingIcon} label={property.name}>
          <CustomFieldInput
            property={property}
            value={(values[property.key] ?? property.default_value ?? null) as TCustomFieldValue}
            onChange={(val) => handleChange(property.key, val)}
          />
        </SidebarPropertyListItem>
      ))}
    </div>
  );
});
