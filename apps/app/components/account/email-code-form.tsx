import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// ui
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { Input, PrimaryButton, SecondaryButton } from "components/ui";
// services
import authenticationService from "services/authentication.service";
import useToast from "hooks/use-toast";
import useTimer from "hooks/use-timer";
// icons

// types
type EmailCodeFormValues = {
  email: string;
  key?: string;
  token?: string;
};

export const EmailCodeForm = ({ onSuccess }: any) => {
  const [codeSent, setCodeSent] = useState(false);
  const [codeResent, setCodeResent] = useState(false);
  const [isCodeResending, setIsCodeResending] = useState(false);
  const [errorResendingCode, setErrorResendingCode] = useState(false);

  const { setToastAlert } = useToast();
  const { timer: resendCodeTimer, setTimer: setResendCodeTimer } = useTimer();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
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

  const isResendDisabled =
    resendCodeTimer > 0 || isCodeResending || isSubmitting || errorResendingCode;

  const onSubmit = async ({ email }: EmailCodeFormValues) => {
    setErrorResendingCode(false);
    await authenticationService
      .emailCode({ email })
      .then((res) => {
        setValue("key", res.key);
        setCodeSent(true);
      })
      .catch((err) => {
        setErrorResendingCode(true);
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: err?.error,
        });
      });
  };

  const handleSignin = async (formData: EmailCodeFormValues) => {
    await authenticationService
      .magicSignIn(formData)
      .then((response) => {
        onSuccess(response);
      })
      .catch((error) => {
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: error?.response?.data?.error ?? "Enter the correct code to sign in",
        });
        setError("token" as keyof EmailCodeFormValues, {
          type: "manual",
          message: error.error,
        });
      });
  };

  const emailOld = getValues("email");

  useEffect(() => {
    setErrorResendingCode(false);
  }, [emailOld]);

  return (
    <>
      <form className="space-y-5 py-5 px-5">
        {(codeSent || codeResent) && (
          <div className="rounded-md bg-green-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  {codeResent
                    ? "Please check your mail for new code."
                    : "Please check your mail for code."}
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
            placeholder="Enter you email Id"
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
            <button
              type="button"
              className={`mt-5 flex w-full justify-end text-xs outline-none ${
                isResendDisabled ? "cursor-default text-gray-400" : "cursor-pointer text-theme"
              } `}
              onClick={() => {
                setIsCodeResending(true);
                onSubmit({ email: getValues("email") }).then(() => {
                  setCodeResent(true);
                  setIsCodeResending(false);
                  setResendCodeTimer(30);
                });
              }}
              disabled={isResendDisabled}
            >
              {resendCodeTimer > 0 ? (
                <p className="text-right">
                  Didn{"'"}t receive code? Get new code in {resendCodeTimer} seconds.
                </p>
              ) : isCodeResending ? (
                "Sending code..."
              ) : errorResendingCode ? (
                "Please try again later"
              ) : (
                "Resend code"
              )}
            </button>
          </div>
        )}
        <div>
          {codeSent ? (
            <PrimaryButton
              type="submit"
              className="w-full text-center"
              size="md"
              onClick={handleSubmit(handleSignin)}
              loading={isSubmitting || (!isValid && isDirty)}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </PrimaryButton>
          ) : (
            <PrimaryButton
              type="submit"
              className="w-full text-center"
              size="md"
              onClick={() => {
                handleSubmit(onSubmit)().then(() => {
                  setResendCodeTimer(30);
                });
              }}
              loading={isSubmitting || (!isValid && isDirty)}
            >
              {isSubmitting ? "Sending code..." : "Send code"}
            </PrimaryButton>
          )}
        </div>
      </form>
    </>
  );
};
