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

import { useEffect } from "react";
import { observer } from "mobx-react";
// plane imports
import type { IIssueType, TIssuePropertyValues } from "@plane/types";
import { getPropertiesDefaultValues } from "@plane/utils";
// store hooks
import { useIssueModal } from "@/hooks/context/use-issue-modal";
// local imports
import { WorkItemCustomPropertyValues } from "./root";

type TWorkItemCustomPropertyValuesCreateProps = {
  arePropertyValuesInitializing: boolean;
  getWorkItemTypeById: (issueTypeId: string) => IIssueType | undefined;
  issuePropertyValues: TIssuePropertyValues;
  issueTypeId: string;
  projectId: string;
  shouldLoadDefaultValues: boolean;
};

export const WorkItemCustomPropertyValuesCreate = observer(function WorkItemCustomPropertyValuesCreate(
  props: TWorkItemCustomPropertyValuesCreateProps
) {
  const {
    arePropertyValuesInitializing,
    getWorkItemTypeById,
    issuePropertyValues,
    issueTypeId,
    projectId,
    shouldLoadDefaultValues,
  } = props;
  // store hooks
  const {
    issuePropertyValues: issuePropertyDefaultValues,
    issuePropertyValueErrors,
    setIssuePropertyValues: handleIssuePropertyValueUpdate,
  } = useIssueModal();
  const issueType = getWorkItemTypeById(issueTypeId);
  // derived values
  const issueTypeDetail = issueType?.asJSON;
  const activeProperties = issueType?.activeProperties;

  useEffect(() => {
    // Only set default values if shouldLoadDefaultValues is true and we have active properties
    if (shouldLoadDefaultValues && activeProperties?.length && !arePropertyValuesInitializing) {
      handleIssuePropertyValueUpdate({
        ...getPropertiesDefaultValues(activeProperties),
        ...issuePropertyValues,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProperties, arePropertyValuesInitializing, handleIssuePropertyValueUpdate, shouldLoadDefaultValues]);

  const handlePropertyValueChange = (propertyId: string, value: string[]) => {
    handleIssuePropertyValueUpdate((prev) => ({
      ...prev,
      [propertyId]: value,
    }));
  };

  if (!issueTypeDetail || !activeProperties?.length) return null;

  return (
    <div className="pt-2">
      <WorkItemCustomPropertyValues
        getWorkItemTypeById={getWorkItemTypeById}
        handlePropertyValueChange={handlePropertyValueChange}
        arePropertyValuesInitializing={arePropertyValuesInitializing}
        issuePropertyValueErrors={issuePropertyValueErrors}
        issuePropertyValues={issuePropertyDefaultValues}
        issueTypeId={issueTypeId}
        projectId={projectId}
        variant="create"
      />
    </div>
  );
});
