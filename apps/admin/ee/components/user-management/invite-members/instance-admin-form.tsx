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

import type { FC } from "react";
import { v4 as uuidv4 } from "uuid";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { EMAIL_VALIDATION_PATTERN } from "@plane/constants";
import { IconButton } from "@plane/propel/icon-button";
import { CopyIcon, InfoIcon, CheckIcon } from "@plane/propel/icons";
import { Banner } from "@plane/propel/banner";
import { Checkbox, Input } from "@plane/ui";
import { Controller, useFormContext } from "react-hook-form";
import { cn, copyTextToClipboard } from "@plane/utils";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import type { TInstanceAdminCreateFormValues } from "./modal";

export const InstanceAdminForm: FC = function InstanceAdminForm() {
  const {
    control,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<TInstanceAdminCreateFormValues>();
  // states
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Derived values
  const passwordValue = watch("password");
  const isRandomPasswordEnabled = watch("generate_random_password") || false;

  // Handlers
  const handleSetIsCopied = () => {
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  };

  const handleCopyPassword = () => {
    if (passwordValue) {
      copyTextToClipboard(passwordValue)
        .then(() => {
          handleSetIsCopied();
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Success",
            message: "Password copied to clipboard",
          });
          return;
        })
        .catch(() => {
          console.error("Failed to copy password to clipboard");
        });
    }
  };

  // Handle generate random password
  useEffect(() => {
    if (isRandomPasswordEnabled) {
      const randomPassword = uuidv4().substring(0, 12);
      setValue("password", randomPassword, { shouldValidate: true, shouldDirty: true });
    }
  }, [isRandomPasswordEnabled, setValue]);

  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="text-body-sm-medium text-primary">
          Email ID <span className="text-danger-primary">*</span>
        </span>
        <Controller
          control={control}
          name="email"
          rules={{
            pattern: {
              value: EMAIL_VALIDATION_PATTERN,
              message: "Please enter a valid email",
            },
            required: "Please enter Email ID",
          }}
          render={({ field }) => <Input {...field} className="w-full" placeholder="Enter Email ID" />}
        />
        {errors.email?.message && (
          <span className="text-danger-primary text-caption-sm-regular">{errors.email.message}</span>
        )}
      </div>

      <div className="w-full flex flex-col gap-1">
        <span className="text-body-sm-medium text-primary">
          Password <span className="text-danger-primary">*</span>
        </span>
        <div className="relative">
          <Controller
            name="password"
            rules={{
              required: "Please enter a password",
              minLength: {
                value: 8,
                message: "Password must be at least 8 character long",
              },
            }}
            render={({ field }) => (
              <>
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...field}
                      className={cn("w-full", { "bg-surface-2": isRandomPasswordEnabled })}
                      readOnly={isRandomPasswordEnabled}
                    />
                    <IconButton
                      icon={showPassword ? EyeOff : Eye}
                      variant={"ghost"}
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1.5"
                    />
                  </div>
                  <IconButton
                    icon={isCopied ? CheckIcon : CopyIcon}
                    variant={"secondary"}
                    size={"xl"}
                    onClick={handleCopyPassword}
                    disabled={!passwordValue}
                  />
                </div>
              </>
            )}
          />
          {errors.password?.message && (
            <span className="text-danger-primary text-caption-sm-regular">{errors.password.message}</span>
          )}
        </div>
      </div>
      <Controller
        name="generate_random_password"
        render={({ field }) => (
          <div className="flex gap-2 items-center">
            <Checkbox
              checked={field.value}
              onChange={field.onChange}
              id="generate_random_password"
              className="focus:outline-none"
            />
            <label className="text-body-xs-regular text-primary" htmlFor="generate_random_password">
              Generate random password.
            </label>
          </div>
        )}
      />
      <div className="flex flex-col">
        <Controller
          name="is_password_reset_required"
          render={({ field }) => (
            <div className="flex gap-2 items-center">
              <Checkbox
                checked={field.value}
                onChange={field.onChange}
                id="is_password_reset_required"
                className="focus:outline-none"
              />
              <label className="text-body-xs-regular text-primary" htmlFor="is_password_reset_required">
                Prompt user to change password after onboarding.
              </label>
            </div>
          )}
        />
        <Banner
          title="Make sure to copy this password and share with the admin personally."
          icon={<InfoIcon />}
          className="bg-layer-1 mt-3 rounded-md h-8.5 px-3"
        />
      </div>
    </>
  );
};
