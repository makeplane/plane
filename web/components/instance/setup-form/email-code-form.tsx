import { FC, useState } from "react";
import { useForm, Controller } from "react-hook-form";
// ui
import { Input, Button } from "@plane/ui";
// icons
import { XCircle } from "lucide-react";
// services
import { AuthService } from "services/auth.service";
const authService = new AuthService();
// hooks
import useToast from "hooks/use-toast";
import useTimer from "hooks/use-timer";

export interface InstanceSetupEmailCodeFormValues {
  email: string;
  token: string;
}

export interface IInstanceSetupEmailCodeForm {
  email: string;
  handleNextStep: () => void;
  moveBack: () => void;
}

export const InstanceSetupEmailCodeForm: FC<IInstanceSetupEmailCodeForm> = (props) => {
  const { handleNextStep, email, moveBack } = props;
  // states
  const [isResendingCode, setIsResendingCode] = useState(false);
  // form info
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<InstanceSetupEmailCodeFormValues>({
    defaultValues: {
      email,
      token: "",
    },
  });
  // hooks
  const { setToastAlert } = useToast();
  const { timer, setTimer } = useTimer(30);
  // computed
  const isResendDisabled = timer > 0 || isResendingCode;

  const handleEmailCodeFormSubmit = async (formValues: InstanceSetupEmailCodeFormValues) =>
    await authService
      .instanceMagicSignIn({ key: `magic_${formValues.email}`, token: formValues.token })
      .then(() => {
        reset();
        handleNextStep();
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        });
      });

  const resendMagicCode = async () => {
    setIsResendingCode(true);

    await authService
      .instanceAdminEmailCode({ email })
      .then(() => setTimer(30))
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "Error!",
          message: err?.error ?? "Something went wrong. Please try again.",
        });
      })
      .finally(() => setIsResendingCode(false));
  };

  return (
    <form onSubmit={handleSubmit(handleEmailCodeFormSubmit)}>
      <h1 className="text-center text-2xl sm:text-2.5xl font-medium text-onboarding-text-100">
        Let{"'"}s secure your instance
      </h1>
      <p className="text-center text-sm text-onboarding-text-200 mt-3">
        Paste the code you got at
        <br />
        <span className="text-custom-primary-100 font-semibold">{email}</span> below.
      </p>
      <div className="relative mt-5 w-full sm:w-96 mx-auto space-y-4">
        <div>
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
              <div className="flex items-center relative rounded-md bg-onboarding-background-200">
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={value}
                  onChange={onChange}
                  disabled
                  placeholder="orville.wright@firstflight.com"
                  className={`w-full h-[46px] placeholder:text-onboarding-text-400 border border-onboarding-border-100 pr-12`}
                />
                <XCircle
                  className="h-5 w-5 absolute stroke-custom-text-400 hover:cursor-pointer right-3"
                  onClick={() => moveBack()}
                />
              </div>
            )}
          />
          <div className="w-full text-right">
            <button
              type="button"
              onClick={resendMagicCode}
              className={`text-xs ${
                isResendDisabled ? "text-onboarding-text-300" : "text-onboarding-text-200 hover:text-custom-primary-100"
              }`}
              disabled={isResendDisabled}
            >
              {timer > 0
                ? `Request new code in ${timer}s`
                : isSubmitting
                ? "Requesting new code..."
                : "Request new code"}
            </button>
          </div>
        </div>
        <Controller
          name="token"
          control={control}
          rules={{ required: true }}
          render={({ field: { value, onChange } }) => (
            <div className={`flex items-center relative rounded-md bg-onboarding-background-200 mb-4`}>
              <Input
                id="token"
                name="token"
                type="text"
                value={value}
                onChange={onChange}
                placeholder="gets-sets-fays"
                className="border-onboarding-border-100 h-[46px] w-full "
              />
            </div>
          )}
        />
        <Button variant="primary" className="w-full" size="xl" type="submit" loading={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Next step"}
        </Button>
      </div>
    </form>
  );
};
