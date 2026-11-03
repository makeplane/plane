/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import type { BaseSyntheticEvent } from "react";
import Link from "next/link";
import { useFormState } from "react-hook-form";
import type { Control, FieldValues } from "react-hook-form";
import { MonitorOutline } from "@makeplane/propel/icons";
// plane internal packages
import { Button } from "@makeplane/propel/components/button";
// components
import { ConfirmDiscardModal } from "@/components/common/confirm-discard-modal";
import type { TControllerInputFormField } from "@/components/common/controller-input";
import { ControllerInput } from "@/components/common/controller-input";
import type { TControllerSwitchFormField } from "@/components/common/controller-switch";
import { ControllerSwitch } from "@/components/common/controller-switch";
import type { TCopyField } from "@/components/common/copy-field";
import { CopyField } from "@/components/common/copy-field";

type Props<T extends FieldValues> = {
  providerName: string;
  control: Control<T>;
  formFields: TControllerInputFormField<T>[];
  switchField: TControllerSwitchFormField<T>;
  onSave: (e?: BaseSyntheticEvent) => Promise<void>;
  serviceDetails: TCopyField[];
  // providers with web-only callback URLs list them separately under a "Web" heading
  webServiceDetails?: TCopyField[];
};

export function OAuthProviderForm<T extends FieldValues>(props: Props<T>) {
  const { providerName, control, formFields, switchField, onSave, serviceDetails, webServiceDetails } = props;
  // form state
  const { isDirty, isSubmitting } = useFormState({ control });
  // states
  const [isDiscardChangesModalOpen, setIsDiscardChangesModalOpen] = useState(false);

  const handleGoBack = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (isDirty) {
      e.preventDefault();
      setIsDiscardChangesModalOpen(true);
    }
  };

  return (
    <>
      <ConfirmDiscardModal
        isOpen={isDiscardChangesModalOpen}
        onDiscardHref="/authentication"
        handleClose={() => setIsDiscardChangesModalOpen(false)}
      />
      <div className="flex flex-col gap-8">
        <div className="grid w-full grid-cols-2 gap-x-8 gap-y-8">
          <div className="col-span-2 flex flex-col gap-y-4 pt-1 md:col-span-1">
            <div className="text-h6-medium text-primary">{providerName}-provided details for Plane</div>
            {formFields.map((field) => (
              <ControllerInput
                key={field.key}
                control={control}
                type={field.type}
                name={field.key}
                label={field.label}
                description={field.description}
                placeholder={field.placeholder}
                error={field.error}
                required={field.required}
              />
            ))}
            <ControllerSwitch control={control} field={switchField} />
            <div className="flex flex-col gap-1 pt-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="primary"
                  size="md"
                  stretch="auto"
                  onClick={(e) => void onSave(e)}
                  loading={isSubmitting}
                  disabled={!isDirty}
                  label={isSubmitting ? "Saving" : "Save changes"}
                />
                <Button
                  variant="secondary"
                  size="md"
                  stretch="auto"
                  nativeButton={false}
                  render={<Link href="/authentication" onClick={handleGoBack} />}
                  label="Go back"
                />
              </div>
            </div>
          </div>
          <div className="col-span-2 flex flex-col gap-y-6 md:col-span-1">
            <div className="text-h6-medium text-primary">Plane-provided details for {providerName}</div>
            <div className="flex flex-col gap-y-4">
              <div className="flex flex-col gap-y-4 rounded-lg bg-layer-1 px-6 py-4">
                {serviceDetails.map((field) => (
                  <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
                ))}
              </div>
              {webServiceDetails && (
                <div className="flex flex-col overflow-hidden rounded-lg">
                  <div className="flex items-center gap-x-2 bg-layer-3 px-6 py-3 text-caption-sm-medium text-secondary uppercase">
                    <MonitorOutline className="size-3.5" />
                    Web
                  </div>
                  <div className="flex flex-col gap-y-4 bg-layer-1 px-6 py-4">
                    {webServiceDetails.map((field) => (
                      <CopyField key={field.key} label={field.label} url={field.url} description={field.description} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
