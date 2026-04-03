/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useForm } from "react-hook-form";
import { Button } from "@plane/propel/button";
import { Dialog, EDialogWidth } from "@plane/propel/dialog";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInstanceStaffUpdate } from "@plane/services";
import { useInstanceStaff } from "@/hooks/store";
import { StaffFormFields } from "./staff-form-fields";
import type { StaffFormValues } from "./staff-form-fields";

type Props = {
  open: boolean;
  onClose: () => void;
  staffId: string | null;
};

export const StaffFormModal = observer(function StaffFormModal({ open, onClose, staffId }: Props) {
  const { staff, updateStaff } = useInstanceStaff();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<StaffFormValues>();

  useEffect(() => {
    if (staffId && staff[staffId]) {
      const m = staff[staffId];
      reset({
        staff_id: m.staff_id,
        first_name: m.user_detail?.first_name ?? "",
        last_name: m.user_detail?.last_name ?? "",
        email: m.email,
        display_name: m.display_name,
        department: m.department ?? "",
        position: m.position,
        job_grade: m.job_grade,
        phone: m.phone,
        date_of_joining: m.date_of_joining ?? "",
        is_department_manager: m.is_department_manager,
        notes: m.notes,
        employment_status: m.employment_status,
      });
    }
  }, [staffId, staff, reset]);

  const onSubmit = async (data: StaffFormValues) => {
    if (!staffId) return;
    setIsSubmitting(true);
    try {
      const payload: IInstanceStaffUpdate = {
        staff_id: data.staff_id,
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: data.display_name,
        department: data.department || null,
        position: data.position,
        job_grade: data.job_grade,
        phone: data.phone,
        date_of_joining: data.date_of_joining || null,
        is_department_manager: data.is_department_manager,
        notes: data.notes,
        employment_status: data.employment_status,
      };
      await updateStaff(staffId, payload);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Staff updated" });
      onClose();
    } catch {
      setToast({ type: TOAST_TYPE.ERROR, title: "Failed to update staff" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()} modal>
      <Dialog.Panel width={EDialogWidth.LG}>
        <div className="p-6">
          <Dialog.Title>Edit Staff Profile</Dialog.Title>
          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 space-y-4">
            <StaffFormFields register={register} errors={errors} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button variant="primary" type="submit" loading={isSubmitting}>
                Save changes
              </Button>
            </div>
          </form>
        </div>
      </Dialog.Panel>
    </Dialog>
  );
});
