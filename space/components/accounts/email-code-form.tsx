import React, { useEffect, useState, useCallback } from "react";

// react hook form
import { useForm } from "react-hook-form";

// services
import authenticationService from "services/authentication.service";

// hooks
import useToast from "hooks/use-toast";
import useTimer from "hooks/use-timer";

// ui
import { Button, Input } from "@plane/ui";

// types
type EmailCodeFormValues = {
  email: string;
  key?: string;
  token?: string;
};

export const EmailCodeForm = ({ handleSignIn }: any) => {
  const [codeSent, setCodeSent] = useState(false);
  const [codeResent, setCodeResent] = useState(false);
  const [isCodeResending, setIsCodeResending] = useState(false);
  const [errorResendingCode, setErrorResendingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setToastAlert } = useToast();
  const { timer: resendCodeTimer, setTimer: setResendCodeTimer } = useTimer();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    getValues,
    watch,
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

  const isResendDisabled = resendCodeTimer > 0 || isCodeResending || isSubmitting || errorResendingCode;

  const onSubmit = useCallback(
    async ({ email }: EmailCodeFormValues) => {
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
    },
    [setToastAlert, setValue]
  );

  const handleSignin = async (formData: EmailCodeFormValues) => {
    setIsLoading(true);
    await authenticationService
      .magicSignIn(formData)
      .then((response) => {
        setIsLoading(false);
        handleSignIn(response);
      })
      .catch((error) => {
        setIsLoading(false);
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: error?.response?.data?.error ?? "Enter the correct code to sign in",
        });
        setError("token" as keyof EmailCodeFormValues, {
          type: "manual",
          message: error?.error,
        });
      });
  };

  const emailOld = getValues("email");

  useEffect(() => {
    setErrorResendingCode(false);
  }, [emailOld]);

  useEffect(() => {
    const submitForm = (e: KeyboardEvent) => {
      if (!codeSent && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(onSubmit)().then(() => {
          setResendCodeTimer(30);
        });
      }
    };

    if (!codeSent) {
      window.addEventListener("keydown", submitForm);
    }

    return () => {
      window.removeEventListener("keydown", submitForm);
    };
  }, [handleSubmit, codeSent, onSubmit, setResendCodeTimer]);

  return (
    <>
      {(codeSent || codeResent) && (
        <p className="text-center mt-4">
          We have sent the sign in code.
          <br />
          Please check your inbox at <span className="font-medium">{watch("email")}</span>
        </p>
      )}
      <form className="space-y-4 mt-10 sm:w-[360px] mx-auto">
        <div className="space-y-1">
          <Input
            id="email"
            type="email"
            placeholder="Enter your email address..."
            className="border-custom-border-300 h-[46px] w-full"
            {...register("email", {
              required: "Email address is required",
              validate: (value) =>
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                  value
                ) || "Email address is not valid",
            })}
          />
          {errors.email && <div className="text-sm text-red-500">{errors.email.message}</div>}
        </div>

        {codeSent && (
          <>
            <Input
              id="token"
              type="token"
              {...register("token", {
                required: "Code is required",
              })}
              placeholder="Enter code..."
              className="border-custom-border-300 h-[46px] w-full"
            />
            {errors.token && <div className="text-sm text-red-500">{errors.token.message}</div>}
            <button
              type="button"
              className={`flex w-full justify-end text-xs outline-none ${
                isResendDisabled ? "cursor-default text-custom-text-200" : "cursor-pointer text-custom-primary-100"
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
                <span className="text-right">Request new code in {resendCodeTimer} seconds</span>
              ) : isCodeResending ? (
                "Sending new code..."
              ) : errorResendingCode ? (
                "Please try again later"
              ) : (
                <span className="font-medium">Resend code</span>
              )}
            </button>
          </>
        )}
        {codeSent ? (
          <Button
            variant="primary"
            type="submit"
            className="w-full"
            size="xl"
            onClick={handleSubmit(handleSignin)}
            disabled={!isValid && isDirty}
            loading={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            size="xl"
            onClick={() => {
              handleSubmit(onSubmit)().then(() => {
                setResendCodeTimer(30);
              });
            }}
            disabled={!isValid && isDirty}
            loading={isSubmitting}
          >
            {isSubmitting ? "Sending code..." : "Send sign in code"}
          </Button>
        )}
      </form>
    </>
  );
};
