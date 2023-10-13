import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
import useTimer from "hooks/use-timer";

// types
type EmailCodeFormValues = {
  email: string;
  key?: string;
  token?: string;
};

const authService = new AuthService();

export const EmailCodeForm = ({ handleSignIn }: any) => {
  const [codeSent, setCodeSent] = useState(false);
  const [codeResent, setCodeResent] = useState(false);
  const [isCodeResending, setIsCodeResending] = useState(false);
  const [errorResendingCode, setErrorResendingCode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { setToastAlert } = useToast();
  const { timer: resendCodeTimer, setTimer: setResendCodeTimer } = useTimer();

  const {
    handleSubmit,
    control,
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

  const onSubmit = async ({ email }: EmailCodeFormValues) => {
    setErrorResendingCode(false);
    await authService
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
    setIsLoading(true);
    await authService
      .magicSignIn(formData)
      .then((response) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSubmit, codeSent]);

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
          <Controller
            control={control}
            name="email"
            rules={{
              required: "Email address is required",
              validate: (value) =>
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                  value
                ) || "Email address is not valid",
            }}
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="email"
                name="email"
                type="email"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.email)}
                placeholder="Enter your email address..."
                className="border-custom-border-300 h-[46px] w-full"
              />
            )}
          />
        </div>

        {codeSent && (
          <>
            <Controller
              control={control}
              name="token"
              rules={{
                required: "Code is required",
              }}
              render={({ field: { value, onChange, ref } }) => (
                <Input
                  id="token"
                  name="token"
                  type="token"
                  value={value ?? ""}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.token)}
                  placeholder="Enter code..."
                  className="border-custom-border-300 h-[46px] w-full"
                />
              )}
            />
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
            size="md"
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
