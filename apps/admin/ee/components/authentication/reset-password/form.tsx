/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
import type { FC } from "react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FormHeader } from "@/components/instance/form-header";
import { Input } from "@plane/ui";
import { Button } from "@plane/propel/button";
import { instanceUserService } from "@plane/services";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { useRouter } from "@/app/compat/next/navigation";

type TPasswordResetForm = {
  new_password: string;
  confirm_new_password: string;
};

export const ResetPasswordForm: FC = observer(function ResetPasswordForm() {
  // router
  const { replace } = useRouter();
  // states
  const [isSubmitting, setSubmitting] = useState<boolean>(false);
  // hook form
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<TPasswordResetForm>({
    mode: "onChange",
  });

  const newPassword = watch("new_password");

  const onSubmit = (data: TPasswordResetForm) => {
    setSubmitting(true);

    instanceUserService
      .resetPassword({
        new_password: data.new_password,
      })
      .then(() => {
        replace("/general/");
        return;
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error",
          message: "Unable to reset password. Try again",
        });
        setSubmitting(false);
      });
  };

  return (
    <div className="mx-auto">
      <div className="min-w-90">
        <FormHeader heading="Reset your password" subHeading="" />
        <div className="flex flex-col gap-4 mt-5">
          <div className="flex flex-col gap-1">
            <label htmlFor="new_password" className="text-caption-md-regular">
              New password
              <span className="text-danger-primary">*</span>
            </label>
            <Controller
              control={control}
              name="new_password"
              rules={{
                required: "New password is requried",
                minLength: {
                  value: 8,
                  message: "Password must be atleast 8 characters long",
                },
              }}
              render={({ field }) => (
                <Input {...field} id="new_password" className="w-full" placeholder="New password" type="password" />
              )}
            />
            {errors.new_password?.message && (
              <span className="text-danger-primary text-caption-xs-regular">*{errors.new_password.message}</span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="confirm_new_password" className="text-caption-md-regular">
              Confirm new password
              <span className="text-danger-primary">*</span>
            </label>
            <Controller
              control={control}
              name="confirm_new_password"
              rules={{
                required: "Password confirmation is required",
                validate: (value) => value === newPassword,
              }}
              render={({ field }) => (
                <Input
                  {...field}
                  id="confirm_new_password"
                  className="w-full"
                  placeholder="Confirm password"
                  type="password"
                />
              )}
            />
            {errors.confirm_new_password?.message && (
              <span className="text-danger-primary text-caption-xs-regular">
                *{errors.confirm_new_password.message}
              </span>
            )}
          </div>
          <Button size={"xl"} onClick={handleSubmit(onSubmit)} disabled={!isValid} loading={isSubmitting}>
            Reset password
          </Button>
        </div>
      </div>
    </div>
  );
});
