/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { AlertTriangle } from "lucide-react";
import { Button } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ICopyYearResponse } from "@plane/types";
import { useBusinessCalendar } from "@/hooks/store";

type FormValues = { from_year: string; to_year: string };

type Props = {
  scheduleId: string;
  open: boolean;
  onClose: () => void;
  currentYear: number;
};

export const CopyYearModal = observer(function CopyYearModal({ scheduleId, open, onClose, currentYear }: Props) {
  const { copyYear } = useBusinessCalendar();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<ICopyYearResponse | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { from_year: String(currentYear), to_year: String(currentYear + 1) },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const res = await copyYear(scheduleId, Number(data.from_year), Number(data.to_year));
      setResult(res);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: `Copied: ${res.copied_holidays} holidays, ${res.copied_overrides} overrides`,
      });
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to copy year" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()} modal>
      <Dialog.Panel width={EDialogWidth.MD}>
        <div className="space-y-4 p-6">
          <Dialog.Title>Copy calendar year</Dialog.Title>

          {result ? (
            <div className="space-y-4">
              {/* Prominent lunar holiday warning */}
              <div className="flex gap-3 rounded-lg border border-warning-strong bg-warning-subtle p-4">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-primary" />
                <div className="space-y-1">
                  <p className="text-body-sm-semibold text-warning-primary">
                    ⚠️ Tet and Hung Kings' Day are lunar holidays — please verify and edit manually
                  </p>
                  <p className="text-caption-sm-regular text-secondary">
                    Lunar-calendar holidays shift every year. Review the copied data before relying on it.
                  </p>
                </div>
              </div>

              <div className="space-y-1 text-body-sm-regular text-secondary">
                <p>
                  Copied <strong>{result.copied_holidays}</strong> holidays and{" "}
                  <strong>{result.copied_overrides}</strong> overrides.
                </p>
                {result.skipped > 0 && (
                  <p className="text-warning-primary">Skipped {result.skipped} duplicate entries.</p>
                )}
              </div>

              {result.warnings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-body-xs-semibold text-secondary">Warnings:</p>
                  <ul className="max-h-40 space-y-1 overflow-y-auto">
                    {result.warnings.map((w, i) => (
                      <li key={i} className="flex gap-1.5 text-caption-sm-regular text-warning-primary">
                        <span className="shrink-0">•</span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="primary" size="sm" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-4">
              <p className="text-body-sm-regular text-secondary">
                Copy all holidays and overrides from one year to another.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="from-year" className="text-body-xs-medium text-secondary">
                    Source year *
                  </label>
                  <Input
                    id="from-year"
                    {...register("from_year", {
                      required: "Required",
                      pattern: { value: /^\d{4}$/, message: "Enter a 4-digit year" },
                    })}
                    placeholder="2025"
                  />
                  {errors.from_year && (
                    <p className="text-caption-sm-regular text-danger-primary">{errors.from_year.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label htmlFor="to-year" className="text-body-xs-medium text-secondary">
                    Target year *
                  </label>
                  <Input
                    id="to-year"
                    {...register("to_year", {
                      required: "Required",
                      pattern: { value: /^\d{4}$/, message: "Enter a 4-digit year" },
                    })}
                    placeholder="2026"
                  />
                  {errors.to_year && (
                    <p className="text-caption-sm-regular text-danger-primary">{errors.to_year.message}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={handleClose}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Copying..." : "Copy"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
