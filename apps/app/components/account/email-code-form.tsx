import React, { useState } from "react";
import { useForm } from "react-hook-form";
// ui
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { Button, Input } from "components/ui";
// services
import authenticationService from "services/authentication.service";
import useToast from "hooks/use-toast";
// icons

// types
type EmailCodeFormValues = {
  email: string;
  key?: string;
  token?: string;
};

export const EmailCodeForm = ({ onSuccess }: any) => {
  const [codeSent, setCodeSent] = useState(false);
  const { setToastAlert } = useToast();
  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting, isValid, isDirty },
  } = useForm<EmailCodeFormValues>({
    defaultValues: {
      email: "",
      key: "",
      token: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  const onSubmit = async ({ email }: EmailCodeFormValues) => {
    await authenticationService
      .emailCode({ email })
      .then((res) => {
        setValue("key", res.key);
        setCodeSent(true);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleSignin = async (formData: EmailCodeFormValues) => {
    await authenticationService
      .magicSignIn(formData)
      .then((response) => {
        onSuccess(response);
      })
      .catch((error) => {
        console.log(error);
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: "Enter the correct code to sign in",
        });
        setError("token" as keyof EmailCodeFormValues, {
          type: "manual",
          message: error.error,
        });
      });
  };

  return (
    <>
      <form className="mt-5 space-y-5">
        {codeSent && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Please check your mail for code.
                </p>
              </div>
            </div>
          </div>
        )}
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

        {codeSent && (
          <div>
            <Input
              id="token"
              type="token"
              name="token"
              register={register}
              validations={{
                required: "Code is required",
              }}
              error={errors.token}
              placeholder="Enter code"
            />
            {/* <button
              type="button"
              className="text-xs outline-none hover:text-theme cursor-pointer"
              onClick={() => {
                handleSubmit(onSubmit);
              }}
            >
              Resend code
            </button> */}
          </div>
        )}
        <div>
          {codeSent ? (
            <Button
              type="submit"
              className="w-full text-center"
              onClick={handleSubmit(handleSignin)}
              disabled={isSubmitting || (!isValid && isDirty)}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          ) : (
            <Button
              type="submit"
              className="w-full text-center"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting || (!isValid && isDirty)}
            >
              {isSubmitting ? "Sending code..." : "Send code"}
            </Button>
          )}
        </div>
      </form>
    </>
  );
};
