import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
// ui
import { Button, Input } from "@plane/ui";
// services
import { AuthService } from "services/auth.service";
// hooks
import useToast from "hooks/use-toast";
import useTimer from "hooks/use-timer";
// icons
import { XCircle } from "lucide-react";
import { useTheme } from "next-themes";

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
  const [sentEmail, setSentEmail] = useState<string>("");

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
        console.log(res);
        setSentEmail(email);
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
    const submitForm = (e: KeyboardEvent) => {
      if (!codeSent && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(onSubmit)().then(() => {
          setResendCodeTimer(30);
        });
      } else if (
        codeSent &&
        sentEmail != getValues("email") &&
        getValues("email").length > 0 &&
        (e.key === "Enter" || e.key === "Tab")
      ) {
        e.preventDefault();
        console.log("resend");
        onSubmit({ email: getValues("email") }).then(() => {
          setCodeResent(true);
        });
      }
    };

    window.addEventListener("keydown", submitForm);

    return () => {
      window.removeEventListener("keydown", submitForm);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSubmit, codeSent, sentEmail]);

  return (
    <>
      {codeSent || codeResent ? (
        <>
          <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-custom-text-100">
            Moving to the runway
          </h1>
          <div className="text-center text-sm text-onboarding-text-200 mt-3">
            <p>Paste the code you got at </p>
            <span className="text-center text-sm text-custom-primary-80 mt-1 font-semibold ">{sentEmail} </span>
            <span className="text-onboarding-text-200">below.</span>
          </div>
        </>
      ) : (
        <>
          <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-onboarding-text-100">
            Let’s get you prepped!
          </h1>
          <p className="text-center text-sm text-onboarding-text-200 mt-3">
            This whole thing will take less than two minutes.
          </p>
          <p className="text-center text-sm text-onboarding-text-200 mt-1">Promise!</p>
        </>
      )}

      <form className="mt-5 sm:w-96 mx-auto">
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
              <div className={`flex items-center relative rounded-md bg-onboarding-background-200`}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={onChange}
                  ref={ref}
                  hasError={Boolean(errors.email)}
                  placeholder="orville.wright@firstflight.com"
                  className={`w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12`}
                />
                {value.length > 0 && (
                  <XCircle
                    className="h-5 w-5 absolute stroke-custom-text-400 hover:cursor-pointer right-3"
                    onClick={() => setValue("email", "")}
                  />
                )}
              </div>
            )}
          />
        </div>

        {codeSent && (
          <>
            <div>
              {codeResent && sentEmail === getValues("email") ? (
                <div className="text-sm my-2.5 text-onboarding-text-300 m-0">
                  You got a new code at <span className="font-semibold text-custom-primary-80">{sentEmail}</span>.
                </div>
              ) : sentEmail != getValues("email") && getValues("email").length > 0 ? (
                <div className="text-sm my-2.5 text-onboarding-text-300 m-0">
                  Hit enter
                  <span> ↵ </span>or <span className="italic">Tab</span> to get a new code
                </div>
              ) : (
                <div className="my-4" />
              )}
            </div>
            <div className={`flex items-center relative rounded-md bg-onboarding-background-200`}>
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
                    placeholder="get-set-fly"
                    className="border-onboarding-border-100 h-[46px] w-full"
                  />
                )}
              />
            </div>
          </>
        )}
        {codeSent ? (
          <div className="my-4">
            {" "}
            <Button
              variant="primary"
              type="submit"
              className="w-full"
              size="xl"
              onClick={handleSubmit(handleSignin)}
              disabled={!isValid && isDirty}
              loading={isLoading}
            >
              {isLoading ? "Signing in..." : "Next step"}
            </Button>
            <div className="w-[70%] my-4 mx-auto">
              <p className="text-xs text-onboarding-text-300">
                When you click the button above, you agree with our{" "}
                <a
                  href="https://plane.so/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline"
                >
                  terms and conditions of service.
                </a>{" "}
              </p>
            </div>
          </div>
        ) : (
          <Button
            variant="primary"
            className="w-full mt-4"
            size="xl"
            onClick={() => {
              handleSubmit(onSubmit)().then(() => {
                setResendCodeTimer(30);
              });
            }}
            disabled={!isValid && isDirty}
            loading={isSubmitting}
          >
            {isSubmitting ? "Sending code..." : "Send unique code"}
          </Button>
        )}
      </form>
    </>
  );
};
