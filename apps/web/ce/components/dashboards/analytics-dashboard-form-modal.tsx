/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { EModalPosition, EModalWidth, ModalCore, TextArea, ToggleSwitch } from "@plane/ui";

export type DashboardFormPayload = { name: string; description: string; access: number };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: DashboardFormPayload) => Promise<void>;
  dashboard?: { name?: string; description?: string | null; access?: number } | null;
};

type FormValues = {
  name: string;
  description: string;
  // access: 0 = private, 1 = public
  access: boolean;
};

const defaultValues: FormValues = { name: "", description: "", access: false };

export const AnalyticsDashboardFormModal = observer(function AnalyticsDashboardFormModal({
  isOpen,
  onClose,
  onSubmit,
  dashboard,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues });

  // Populate form when editing
  useEffect(() => {
    if (isOpen) {
      reset({
        name: dashboard?.name ?? "",
        description: dashboard?.description ?? "",
        access: dashboard?.access === 1,
      });
    }
  }, [isOpen, dashboard, reset]);

  const handleClose = () => {
    reset(defaultValues);
    onClose();
  };

  const handleFormSubmit = async (formData: FormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit({
        name: formData.name,
        description: formData.description || "",
        access: formData.access ? 1 : 0,
      });
      handleClose();
    } catch {
      // Error toast handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!dashboard;

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <form onSubmit={(e) => void handleSubmit(handleFormSubmit)(e)}>
        <div className="space-y-5 p-5">
          <h3 className="text-xl font-medium text-color-primary">
            {isEditing ? "Update Dashboard" : "Create Dashboard"}
          </h3>

          {/* Name */}
          <div className="space-y-1">
            <label htmlFor="dashboard-name" className="text-sm font-medium text-color-secondary">
              Name <span className="text-color-danger-primary">*</span>
            </label>
            <Controller
              name="name"
              control={control}
              rules={{
                required: "Name is required",
                maxLength: { value: 255, message: "Name must be 255 characters or less" },
              }}
              render={({ field }) => (
                <Input
                  id="dashboard-name"
                  {...field}
                  placeholder="Dashboard name"
                  className="w-full"
                  hasError={!!errors.name}
                  // eslint-disable-next-line jsx-a11y/no-autofocus -- Modal input should auto-focus for UX
                  autoFocus
                />
              )}
            />
            {errors.name && <p className="text-xs text-color-danger-primary">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label htmlFor="dashboard-description" className="text-sm font-medium text-color-secondary">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  id="dashboard-description"
                  {...field}
                  placeholder="Add description (optional)"
                  className="w-full resize-none"
                  rows={3}
                />
              )}
            />
          </div>

          {/* Access toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-color-secondary">Public access</p>
              <p className="text-xs text-color-tertiary">Allow all workspace members to view this dashboard</p>
            </div>
            <Controller
              name="access"
              control={control}
              render={({ field }) => (
                <ToggleSwitch value={field.value} onChange={field.onChange} size="sm" disabled={isSubmitting} />
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-color-subtle px-5 py-4">
          <Button variant="secondary" size="sm" onClick={handleClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {isEditing ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
