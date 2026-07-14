/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TOffice } from "@plane/types";
import { AlertModalCore, EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
// services
import { payrollService } from "@/services/payroll.service";
// local imports
import { FIELD, LABEL } from "./shared";

type Props = {
  workspaceSlug: string;
  isOpen: boolean;
  offices: TOffice[];
  onClose: () => void;
  onChanged: () => void;
};

export function OfficesModal(props: Props) {
  const { workspaceSlug, isOpen, offices, onClose, onChanged } = props;
  const { t } = useTranslation();
  const [name, setName] = useState("");
  // Legal minimum in Mexico; an office may pay more, never less
  const [aguinaldoDays, setAguinaldoDays] = useState("15");
  const [deleteTarget, setDeleteTarget] = useState<TOffice | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await payrollService.createOffice(workspaceSlug, {
        name: name.trim(),
        aguinaldo_days: Number(aguinaldoDays) || 15,
      });
      setName("");
      setAguinaldoDays("15");
      onChanged();
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("payroll.toasts.error"),
        message: error?.name?.[0] ?? undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);
    try {
      await payrollService.deleteOffice(workspaceSlug, deleteTarget.id);
      setDeleteTarget(null);
      onChanged();
    } catch (error: any) {
      // 409 when the office still pays people — deleting it would orphan the
      // salaries and payments hanging off it
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("payroll.toasts.error"),
        message: error?.error ?? t("payroll.offices.in_use"),
      });
      setDeleteTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AlertModalCore
        isOpen={deleteTarget !== null}
        handleClose={() => setDeleteTarget(null)}
        handleSubmit={() => void handleDelete()}
        isSubmitting={isSubmitting}
        title={t("payroll.offices.delete_title")}
        content={t("payroll.offices.delete_description")}
      />

      <ModalCore isOpen={isOpen} handleClose={onClose} position={EModalPosition.CENTER} width={EModalWidth.XL}>
        <div className="p-4">
          <h3 className="text-15 mb-4 font-medium">{t("payroll.offices.manage")}</h3>

          <div className="mb-3 flex items-end gap-2">
            <div className="flex-1">
              <label className={LABEL}>{t("payroll.fields.name")}</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} className="w-full" />
            </div>
            <div className="w-28">
              <label className={LABEL}>{t("payroll.fields.aguinaldo_days")}</label>
              <input
                type="number"
                min="15"
                className={FIELD}
                value={aguinaldoDays}
                onChange={(event) => setAguinaldoDays(event.target.value)}
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleCreate()}
              disabled={!name.trim() || isSubmitting}
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {offices.length === 0 ? (
            <p className="py-4 text-center text-13 text-tertiary">{t("payroll.offices.empty")}</p>
          ) : (
            <ul className="max-h-72 divide-y divide-subtle overflow-y-auto">
              {offices.map((office) => (
                <li key={office.id} className="flex items-center justify-between gap-2 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-13">{office.name}</p>
                    <p className="text-11 text-tertiary">
                      {office.aguinaldo_days} {t("payroll.aguinaldo.days").toLowerCase()}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(office)}
                    className="rounded-sm p-1 text-tertiary hover:bg-layer-1-hover hover:text-danger-primary"
                    title={t("payroll.actions.delete")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 flex justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t("payroll.actions.close")}
            </Button>
          </div>
        </div>
      </ModalCore>
    </>
  );
}
