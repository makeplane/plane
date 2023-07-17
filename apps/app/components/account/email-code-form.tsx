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
    setIsLoading(true);
    await authenticationService
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
      <form className="space-y-4 mt-10 w-full sm:w-[360px] mx-auto">
        <div className="space-y-1">
          <Input
            id="email"
            type="email"
            name="email"
            register={register}
            validations={{
              required: "Email address is required",
              validate: (value) =>
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                  value
                ) || "Email address is not valid",
            }}
            error={errors.email}
            placeholder="Enter your email address..."
          />
        </div>

        {codeSent && (
          <>
            <Input
              id="token"
              type="token"
              name="token"
              register={register}
              validations={{
                required: "Code is required",
              }}
              error={errors.token}
              placeholder="Enter code..."
            />
            <button
              type="button"
              className={`flex w-full justify-end text-xs outline-none ${
                isResendDisabled
                  ? "cursor-default text-custom-text-200"
                  : "cursor-pointer text-custom-primary-100"
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
                "Resend code"
              )}
            </button>
          </>
        )}
        {codeSent ? (
          <PrimaryButton
            type="submit"
            className="w-full text-center"
            size="md"
            onClick={handleSubmit(handleSignin)}
            disabled={!isValid && isDirty}
            loading={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </PrimaryButton>
        ) : (
          <PrimaryButton
            className="w-full text-center"
            size="md"
            onClick={() => {
              handleSubmit(onSubmit)().then(() => {
                setResendCodeTimer(30);
              });
            }}
            disabled={!isValid && isDirty}
            loading={isSubmitting}
          >
            {isSubmitting ? "Sending code..." : "Send sign in code"}
          </PrimaryButton>
        )}
      </form>
    </>
  );
};
