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
import type { IDashboard } from "@plane/types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  dashboard?: IDashboard | null;
  workspaceSlug: string;
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
      <form
        onSubmit={(e) => {
          void handleSubmit(handleFormSubmit)(e);
        }}
      >
        <div className="space-y-5 p-5">
          <h3 className="text-xl font-medium text-color-primary">
            {isEditing ? "Update Dashboard" : "Create Dashboard"}
          </h3>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-color-secondary">
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
            <label htmlFor="description" className="text-sm font-medium text-color-secondary">
              Description
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea
                  id="description"
                  {...field}
                  placeholder="Add description (optional)"
                  className="w-full resize-none"
                  rows={3}
                />
              )}
            />
          </div>

          {/* Public toggle */}
          <div className="flex items-center justify-between">
            <label htmlFor="access" className="text-sm font-medium text-color-secondary">
              Make this dashboard public
            </label>
            <Controller
              name="access"
              control={control}
              render={({ field }) => (
                <ToggleSwitch
                  id="access"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                />
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="neutral" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </ModalCore>
  );
});
