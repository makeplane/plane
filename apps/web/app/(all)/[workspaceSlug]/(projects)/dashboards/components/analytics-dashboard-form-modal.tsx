/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import type { IAnalyticsDashboard, TAnalyticsDashboardCreate } from "@plane/types";
import { Button, EModalPosition, EModalWidth, Input, ModalCore, TextArea } from "@plane/ui";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TAnalyticsDashboardCreate) => Promise<void>;
  dashboard?: IAnalyticsDashboard | null;
};

type FormValues = {
  name: string;
  description: string;
};

const defaultValues: FormValues = {
  name: "",
  description: "",
};

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

  // Reset form when modal opens with dashboard data
  useEffect(() => {
    if (isOpen) {
      reset({
        name: dashboard?.name ?? "",
        description: dashboard?.description ?? "",
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
        description: formData.description || null,
        logo_props: dashboard?.logo_props ?? {},
        config: dashboard?.config ?? { project_ids: [] },
      });
      handleClose();
    } catch {
      // Error handled by caller via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.TOP} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <div className="space-y-5 p-5">
          <h3 className="text-xl font-medium text-custom-text-200">
            {dashboard ? "Update dashboard" : "Create dashboard"}
          </h3>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-custom-text-300">
              Name <span className="text-red-500">*</span>
            </label>
            <Controller
              name="name"
              control={control}
              rules={{ required: "Name is required", maxLength: { value: 255, message: "Max 255 characters" } }}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Analytics Dashboard"
                  className="w-full"
                  hasError={!!errors.name}
                  autoFocus
                />
              )}
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-custom-text-300">Description</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea {...field} placeholder="Dashboard description..." className="w-full" rows={3} />
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-custom-border-200 px-5 py-4">
          <Button variant="neutral-primary" size="sm" onClick={handleClose} type="button" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {dashboard ? "Update dashboard" : "Create dashboard"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
