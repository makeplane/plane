/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Button, getButtonStyling } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IInstanceStaffCreate } from "@plane/services";
import { PageWrapper } from "@/components/common/page-wrapper";
import { useInstanceStaff } from "@/hooks/store";
import { StaffFormFields } from "../components/staff-form-fields";
import type { StaffFormValues } from "../components/staff-form-fields";

const StaffCreatePage = observer(function StaffCreatePage() {
  const router = useRouter();
  const { createStaff } = useInstanceStaff();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<StaffFormValues>({
    defaultValues: {
      staff_id: "",
      first_name: "",
      last_name: "",
      email: "",
      display_name: "",
      department: "",
      position: "",
      job_grade: "",
      phone: "",
      date_of_joining: "",
      is_department_manager: false,
      notes: "",
      employment_status: "active",
    },
  });

  const onSubmit = async (data: StaffFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: IInstanceStaffCreate = {
        staff_id: data.staff_id,
        user: "",
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        display_name: data.display_name || `${data.first_name} ${data.last_name}`.trim(),
        department: data.department || null,
        position: data.position,
        job_grade: data.job_grade,
        phone: data.phone,
        date_of_joining: data.date_of_joining || null,
        date_of_leaving: null,
        is_department_manager: data.is_department_manager,
        notes: data.notes,
        employment_status: data.employment_status,
      };
      await createStaff(payload);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "Staff created successfully" });
      router.push("/staff");
    } catch (err) {
      const error = err as Record<string, string[] | string>;
      const msg = Array.isArray(error?.email)
        ? error.email[0]
        : typeof error?.detail === "string"
          ? error.detail
          : "Failed to create staff";
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageWrapper header={{ title: "Add Staff", description: "Create a new staff profile." }}>
      <div className="pt-4 max-w-2xl">
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-6">
          <StaffFormFields register={register} errors={errors} watch={watch} setValue={setValue} control={control} />
          <div className="flex items-center gap-4 pt-2">
            <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create staff"}
            </Button>
            <Link href="/staff" className={getButtonStyling("secondary", "lg")}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
});

export function meta() {
  return [{ title: "Add Staff - God Mode" }];
}

export default StaffCreatePage;
