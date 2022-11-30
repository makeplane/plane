import React from "react";
// next
import Link from "next/link";
import { useRouter } from "next/router";
// react hook form
import { useForm } from "react-hook-form";
// ui
import { Button, Input } from "ui";
import authenticationService from "lib/services/authentication.service";

// types
type SignIn = {
  email: string;
  password?: string;
  medium?: string;
};

const EmailPasswordForm = ({ onSuccess }: any) => {
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    formState: { errors, isSubmitting, dirtyFields, isValid, isDirty },
  } = useForm<SignIn>({
    defaultValues: {
      email: "",
      password: "",
      medium: "email",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit = (formData: SignIn) => {
    authenticationService
      .emailLogin(formData)
      .then(async (response) => {
        await onSuccess(response);
      })
      .catch((error) => {
        console.log(error);
        if (!error?.response?.data) return;
        Object.keys(error.response.data).forEach((key) => {
          const err = error.response.data[key];
          console.log("err", err);
          setError(key as keyof SignIn, {
            type: "manual",
            message: Array.isArray(err) ? err.join(", ") : err,
          });
        });
      });
  };
  return (
    <>
      <form className="mt-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <Input
            id="email"
            type="email"
            name="email"
            register={register}
            validations={{
              required: "Email ID is required",
              validate: (value) =>
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                  value
                ) || "Email ID is not valid",
            }}
            error={errors.email}
            placeholder="Enter your Email ID"
          />
        </div>
        <div className="mt-5">
          <Input
            id="password"
            type="password"
            name="password"
            register={register}
            validations={{
              required: "Password is required",
            }}
            error={errors.password}
            placeholder="Enter your password"
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm ml-auto">
            <Link
              href={"/forgot-password"}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </Link>
          </div>
        </div>
        <div className="mt-5">
          <Button
            disabled={isSubmitting || (!isValid && isDirty)}
            className="w-full text-center"
            type="submit"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </Button>
        </div>
      </form>
    </>
  );
};

export default EmailPasswordForm;
