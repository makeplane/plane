import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
// icons
import { XCircle } from "lucide-react";
// ui
import { Input, Button } from "@plane/ui";
// hooks
import useTimer from "hooks/use-timer";
import useToast from "hooks/use-toast";
// services
import { AuthService } from "services/auth.service";
const authService = new AuthService();

export type InstanceSetupFormValues = {
  email: string;
  token: string;
  password: string;
};

export const InstanceSetupForm = () => {
  const [isCodeResending, setCodeResending] = useState<boolean>(false);
  const [isCodeRequested, setCodeRequested] = useState<boolean>(false);
  const [isCodeResent, setCodeResent] = useState<boolean>(false);
  const [isCodeVerified, setCodeVerified] = useState<boolean>(false);
  // hooks
  const { setToastAlert } = useToast();
  const { timer: resendCodeTimer, setTimer: setResendCodeTimer } = useTimer();
  // form info
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<InstanceSetupFormValues>({
    defaultValues: {
      email: "",
      token: "",
      password: "",
    },
  });
  // computed
  const isResendDisabled = resendCodeTimer > 0 || isCodeResending || isSubmitting;

  const onMagicCodeSent = (formData: InstanceSetupFormValues) => {
    console.log("values", formData);
    return authService
      .emailCode({ email: formData.email })
      .then((res) => {
        // setSentEmail(email);
        // setValue("key", res.key);
        // setCodeSent(true);
        setCodeResending(false);
        setResendCodeTimer(30);
      })
      .catch((err) => {
        // setErrorResendingCode(true);
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: err?.error,
        });
      });
  };

  const resendMagicCode = () => {
    setCodeResent(true);
    return authService
      .emailCode({ email: watch("email") })
      .then((res) => {
        // setSentEmail(email);
        // setValue("key", res.key);
        // setCodeSent(true);
        setCodeResending(false);
        setResendCodeTimer(30);
      })
      .catch((err) => {
        // setErrorResendingCode(true);
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: err?.error,
        });
      });
  };

  const verifyMagicCode = () => authService.magicSignIn({ email: watch("email"), code: watch("token") });

  return (
    <div className="pb-2">
      <>
        <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-onboarding-text-100">
          Let’s secure your instance
        </h1>
        {isCodeRequested ? (
          <div className="text-center text-sm text-onboarding-text-200 mt-3">
            <p>Paste the code you got at </p>
            <span className="text-center text-sm text-custom-primary-80 mt-1 font-semibold ">{watch("email")} </span>
            <span className="text-onboarding-text-200">below.</span>
          </div>
        ) : (
          <p className="text-center text-sm text-onboarding-text-200 mt-3">
            Explore privacy options. Get AI features. Secure access. <br /> Takes 2 minutes.
          </p>
        )}

        <div className="relative mt-10 w-full sm:w-[360px] mx-auto">
          <Controller
            name="email"
            control={control}
            rules={{
              required: "Email address is required",
              validate: (value) =>
                /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(
                  value
                ) || "Email address is not valid",
            }}
            render={({ field: { value, onChange } }) => (
              <div className={`flex items-center relative rounded-md bg-onboarding-background-200`}>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={onChange}
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
          <p className="text-xs text-custom-text-400 mt-0 py-2">
            Use your email address if you are the instance admin. <br /> Use your admin’s e-mail if you are not.
          </p>
          {isCodeRequested && (
            <div
              className={`flex w-full justify-end text-xs outline-none ${
                isResendDisabled ? "cursor-default text-custom-text-200" : "cursor-pointer text-custom-primary-100"
              } `}
            >
              {resendCodeTimer > 0 ? (
                <span className="text-right">Request new code in {resendCodeTimer}s</span>
              ) : isCodeResending ? (
                "Sending new code..."
              ) : null}
            </div>
          )}
          {resendCodeTimer <= 0 && !isResendDisabled && isCodeRequested && (
            <div className="flex justify-end w-full">
              <button
                type="button"
                className="w-fit pb-2 mt-[-20px] text-xs outline-none cursor-pointer text-custom-primary-100"
                onClick={resendMagicCode}
                disabled={isResendDisabled}
              >
                <span className="font-medium">Resend</span>
              </button>
            </div>
          )}

          {isCodeRequested && (
            <Controller
              name="token"
              control={control}
              rules={{ required: true }}
              render={({ field: { value, onChange } }) => (
                <Input
                  id="token"
                  name="token"
                  type="text"
                  value={value}
                  onChange={onChange}
                  placeholder="gets-sets-flys"
                  className="border-onboarding-border-100 h-[46px] w-full"
                />
              )}
            />
          )}

          {isCodeRequested ? (
            <Button
              variant="primary"
              className="w-full mt-4"
              size="xl"
              onClick={() => {
                setCodeRequested(true);
                handleSubmit(verifyMagicCode)().then(() => {
                  setResendCodeTimer(30);
                });
              }}
              disabled={!!errors.email}
              loading={isSubmitting}
            >
              {isSubmitting ? "submitting..." : "Next step"}
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full mt-4"
              size="xl"
              onClick={() => {
                setCodeRequested(true);
                handleSubmit(onMagicCodeSent)().then(() => {
                  setResendCodeTimer(30);
                });
              }}
              disabled={!!errors.email}
              loading={isSubmitting}
            >
              {isSubmitting ? "Sending code..." : "Send unique code"}
            </Button>
          )}
        </div>
      </>
    </div>
  );
};
