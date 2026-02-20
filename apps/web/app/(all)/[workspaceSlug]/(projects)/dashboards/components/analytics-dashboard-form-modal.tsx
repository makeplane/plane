/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "@plane/i18n";
import type { IAnalyticsDashboard, TAnalyticsDashboardCreate } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { EModalPosition, EModalWidth, ModalCore, TextArea } from "@plane/ui";

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
  const { t } = useTranslation();
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
            {dashboard ? t("analytics_dashboard.update") : t("analytics_dashboard.create")}
          </h3>

          {/* Name */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-custom-text-300">
              {t("analytics_dashboard.name.label")} <span className="text-red-500">*</span>
            </label>
            <Controller
              name="name"
              control={control}
              rules={{ required: t("analytics_dashboard.name_required"), maxLength: { value: 255, message: t("analytics_dashboard.max_characters", { count: 255 }) } }}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder={t("analytics_dashboard.name.placeholder")}
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
            <label className="text-sm font-medium text-custom-text-300">{t("analytics_dashboard.description.label")}</label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextArea {...field} placeholder={t("analytics_dashboard.description.placeholder")} className="w-full" rows={3} />
              )}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-custom-border-200 px-5 py-4">
          <Button variant="secondary" size="sm" onClick={handleClose} type="button" disabled={isSubmitting}>
            {t("cancel")}
          </Button>
          <Button variant="primary" size="sm" type="submit" loading={isSubmitting}>
            {dashboard ? t("analytics_dashboard.update") : t("analytics_dashboard.create")}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
});
