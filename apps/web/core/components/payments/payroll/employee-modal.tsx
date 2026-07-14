/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TEmployee } from "@plane/types";
import { EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { FIELD, LABEL, todayIso } from "./shared";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  employee: TEmployee | null;
  onClose: () => void;
  onSaved: () => void;
};

type FormState = {
  full_name: string;
  email: string;
  national_id: string;
  position: string;
  hire_date: string;
  termination_date: string;
  notes: string;
};

const emptyForm = (): FormState => ({
  full_name: "",
  email: "",
  national_id: "",
  position: "",
  hire_date: todayIso(),
  termination_date: "",
  notes: "",
});

export function EmployeeModal(props: Props) {
  const { workspaceSlug, isOpen, employee, onClose, onSaved } = props;
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForm(
      employee
        ? {
            full_name: employee.full_name,
            email: employee.email,
            national_id: employee.national_id,
            position: employee.position,
            hire_date: employee.hire_date,
            termination_date: employee.termination_date ?? "",
            notes: employee.notes,
          }
        : emptyForm()
    );
  }, [isOpen, employee]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((previous) => ({ ...previous, [key]: value }));

  const handleSubmit = async () => {
    if (!form.full_name.trim() || !form.hire_date) return;
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        // "" is not a date; the API wants null for someone still employed
        termination_date: form.termination_date || null,
      } as Partial<TEmployee>;
      if (employee) await payrollService.updateEmployee(workspaceSlug, employee.id, payload);
      else await payrollService.createEmployee(workspaceSlug, payload);
      setToast({ type: TOAST_TYPE.SUCCESS, title: t("payroll.toasts.saved") });
      onSaved();
      onClose();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("payroll.toasts.error"),
        message: error?.termination_date?.[0] ?? error?.full_name?.[0] ?? undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <div className="p-4">
        <h3 className="text-15 mb-4 font-medium">{t(employee ? "payroll.employees.edit" : "payroll.employees.new")}</h3>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className={LABEL}>{t("payroll.fields.full_name")}</label>
            <Input
              value={form.full_name}
              onChange={(event) => set("full_name", event.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.position")}</label>
            <Input value={form.position} onChange={(event) => set("position", event.target.value)} className="w-full" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.national_id")}</label>
            <Input
              value={form.national_id}
              onChange={(event) => set("national_id", event.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.email")}</label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => set("email", event.target.value)}
              className="w-full"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.hire_date")}</label>
            <input
              type="date"
              className={FIELD}
              value={form.hire_date}
              onChange={(event) => set("hire_date", event.target.value)}
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className={LABEL}>{t("payroll.fields.termination_date")}</label>
            <input
              type="date"
              className={FIELD}
              value={form.termination_date}
              onChange={(event) => set("termination_date", event.target.value)}
            />
          </div>
          <div className="col-span-2">
            <label className={LABEL}>{t("payroll.fields.notes")}</label>
            <textarea
              className={FIELD}
              rows={2}
              value={form.notes}
              onChange={(event) => set("notes", event.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t("payroll.actions.cancel")}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleSubmit()}
            loading={isSubmitting}
            disabled={!form.full_name.trim() || !form.hire_date}
          >
            {t("payroll.actions.save")}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}
