"use client";

import { FC } from "react";
import { Button } from "@plane/ui";
import { useTranslation } from "@plane/i18n";

interface IRerunModalProps {
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const RerunModal: FC<IRerunModalProps> = ({ onClose, onSubmit, isLoading }) => {
  const { t } = useTranslation();
  return (
    <div className="space-y-5 p-5">
      <div className="space-y-2">
        <div className="text-xl font-medium text-custom-text-200">{t("importers.re_run_import_job")}</div>
        <div className="text-sm text-custom-text-300">{t("importers.re_run_import_job_confirmation")}</div>
      </div>
      <div className="relative flex justify-end items-center gap-2">
        <Button variant="neutral-primary" size="sm" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button variant="primary" size="sm" onClick={onSubmit} loading={isLoading} disabled={isLoading}>
          {isLoading ? t("common.processing") : t("common.continue")}
        </Button>
      </div>
    </div>
  );
};
