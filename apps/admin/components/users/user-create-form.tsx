/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
// plane imports
import { Button, getButtonStyling } from "@plane/propel/button";
import { Input } from "@plane/propel/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// hooks
import { useInstanceUser } from "@/hooks/store";

type FormValues = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
};

export function UserCreateForm() {
  const router = useRouter();
  const { createUser } = useInstanceUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: { first_name: "", last_name: "", email: "", password: "" },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await createUser(data);
      setToast({ type: TOAST_TYPE.SUCCESS, title: "User created successfully" });
      router.push("/users");
    } catch (err) {
      const error = err as Record<string, string[] | string>;
      const emailError = Array.isArray(error?.email) ? error.email[0] : undefined;
      const message = emailError || (typeof error?.detail === "string" ? error.detail : "Failed to create user");
      setToast({ type: TOAST_TYPE.ERROR, title: "Error", message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4 max-w-lg">
      <div className="space-y-1">
        <label htmlFor="first_name" className="text-sm font-medium">
          First name *
        </label>
        <Input
          id="first_name"
          {...register("first_name", { required: "First name is required" })}
          placeholder="First name"
        />
        {errors.first_name && <p className="text-11 text-color-danger-primary">{errors.first_name.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="last_name" className="text-sm font-medium">
          Last name
        </label>
        <Input id="last_name" {...register("last_name")} placeholder="Last name" />
      </div>

      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email *
        </label>
        <Input
          id="email"
          type="email"
          {...register("email", { required: "Email is required" })}
          placeholder="user@example.com"
        />
        {errors.email && <p className="text-11 text-color-danger-primary">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password *
        </label>
        <Input
          id="password"
          type="password"
          {...register("password", {
            required: "Password is required",
            minLength: { value: 8, message: "Minimum 8 characters" },
          })}
          placeholder="Minimum 8 characters"
        />
        {errors.password && <p className="text-11 text-color-danger-primary">{errors.password.message}</p>}
      </div>

      <div className="flex items-center gap-4 pt-4">
        <Button type="submit" variant="primary" size="lg" loading={isSubmitting}>
          {isSubmitting ? "Creating" : "Create user"}
        </Button>
        <Link href="/users" className={getButtonStyling("secondary", "lg")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
