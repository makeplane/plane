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
import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// Plane components
import { ModalCore } from "@plane/ui";
// hooks
// Assets
import type { StateMappingFormProps, SentryStateMappingFormData } from "./types";
import { StateMappingFormContent } from ".";

// Types

/**
 * Main Form Component for Sentry State Mapping Configuration
 * Handles the modal, data loading, and form state
 */
function StateMappingForm({
  modal,
  handleModal,
  stateMapping,
  handleSubmit: handleSubmitProp,
  availableProjects,
}: StateMappingFormProps) {
  const { t } = useTranslation();

  // Initialize form state with the state mapping data if it exists
  const [formData, setFormData] = useState<SentryStateMappingFormData>({
    projectId: stateMapping?.projectId || "",
    resolvedState: stateMapping?.resolvedState || null,
    unresolvedState: stateMapping?.unresolvedState || null,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Update form data when stateMapping changes (important for edit mode)
  useEffect(() => {
    if (stateMapping) {
      setFormData({
        projectId: stateMapping.projectId || "",
        resolvedState: stateMapping.resolvedState || null,
        unresolvedState: stateMapping.unresolvedState || null,
      });
    }
  }, [stateMapping]);

  // Reset form when modal changes
  useEffect(() => {
    if (!modal) {
      // Only clear the form when closing if we're not in edit mode (stateMapping is undefined)
      if (!stateMapping) {
        setFormData({
          projectId: "",
          resolvedState: null,
          unresolvedState: null,
        });
      }
    }
  }, [modal, stateMapping]);

  // Handle form field changes with useCallback to prevent re-renders
  const handleFormChange = useCallback(
    <T extends keyof SentryStateMappingFormData>(key: T, value: SentryStateMappingFormData[T]) => {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));

      // When project changes, clear state selections
      if (key === "projectId") {
        setFormData((prev) => ({
          ...prev,
          resolvedState: null,
          unresolvedState: null,
        }));
      }
    },
    []
  );

  // Handle form submission with useCallback
  const handleSubmit = useCallback(async () => {
    if (!formData.projectId || !formData.resolvedState || !formData.unresolvedState) {
      return;
    }

    setIsLoading(true);
    try {
      await handleSubmitProp(formData.projectId, formData.resolvedState, formData.unresolvedState);
      handleModal(false);
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Failed to save state mapping",
        message: "Please try again later",
      });
    } finally {
      setIsLoading(false);
    }
  }, [formData.projectId, formData.resolvedState, formData.unresolvedState, handleSubmitProp, handleModal]);

  // Handle form cancellation with useCallback
  const handleCancel = useCallback(() => {
    // Reset form to initial state
    setFormData({
      projectId: stateMapping?.projectId || "",
      resolvedState: stateMapping?.resolvedState || null,
      unresolvedState: stateMapping?.unresolvedState || null,
    });

    handleModal(false);
  }, [stateMapping, handleModal]);

  return (
    <ModalCore isOpen={modal} handleClose={handleCancel}>
      <div className="space-y-5 p-7">
        {/* Header */}
        <div className="space-y-1">
          <div className="text-body-sm-medium">{stateMapping ? "Edit State Mapping" : "Create State Mapping"}</div>
          <div className="text-body-xs-regular text-secondary">
            Map Sentry issue states to your project states. Configure which states to use when a Sentry issue is
            resolved or unresolved.
          </div>
        </div>

        {/* Form Content */}
        <div className="space-y-4">
          <StateMappingFormContent
            value={formData}
            availableProjects={availableProjects}
            handleChange={handleFormChange}
            isEditMode={!!stateMapping}
          />

          {/* Action Buttons */}
          <div className="relative flex justify-end items-center gap-2">
            <Button variant="secondary" onClick={handleCancel} disabled={isLoading}>
              {t("cancel")}
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={!formData.projectId || !formData.resolvedState || !formData.unresolvedState || isLoading}
              loading={isLoading}
            >
              {isLoading ? "Saving..." : t("save")}
            </Button>
          </div>
        </div>
      </div>
    </ModalCore>
  );
}

export default StateMappingForm;
