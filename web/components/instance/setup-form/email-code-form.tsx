import { FC } from "react";
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
  const isResendDisabled = timer > 0 || isSubmitting;

  const handleEmailCodeFormSubmit = (formValues: InstanceSetupEmailCodeFormValues) =>
    authService
      .instanceMagicSignIn({ key: `magic_${formValues.email}`, token: formValues.token })
      .then(() => {
        reset();
        handleNextStep();
      })
      .catch((err) => {
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: err?.error,
        });
      });

  const resendMagicCode = () => {
    setTimer(30);
    authService
      .instanceAdminEmailCode({ email })
      .then(() => {
        // setCodeResending(false);
        setTimer(30);
      })
      .catch((err) => {
        setToastAlert({
          title: "Oops!",
          type: "error",
          message: err?.error,
        });
      });
  };

  return (
    <form onSubmit={handleSubmit(handleEmailCodeFormSubmit)}>
      <div className="pb-2">
        <h1 className="text-center text-2xl sm:text-2.5xl font-semibold text-onboarding-text-100">
          Let’s secure your instance
        </h1>
        <div className="text-center text-sm text-onboarding-text-200 mt-3">
          <p>Paste the code you got at </p>
          <span className="text-center text-sm text-custom-primary-80 mt-1 font-semibold ">{email}</span>
          <span className="text-onboarding-text-200">below.</span>
        </div>

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
              <div className={`flex items-center relative rounded-md bg-onboarding-background-200 mb-4`}>
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
          <div
            className={`flex w-full justify-end text-xs outline-none ${
              isResendDisabled ? "cursor-default text-custom-text-200" : "cursor-pointer text-custom-primary-100"
            } `}
          >
            {timer > 0 ? (
              <span className="text-right">Request new code in {timer}s</span>
            ) : isSubmitting ? (
              "Sending new code..."
            ) : (
              <div className="flex justify-end w-full">
                <button
                  type="button"
                  className="w-fit pb-2 text-xs outline-none cursor-pointer text-custom-primary-100"
                  onClick={resendMagicCode}
                  disabled={isResendDisabled}
                >
                  <span className="font-medium">Resend</span>
                </button>
              </div>
            )}
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
                  placeholder="gets-sets-flys"
                  className="border-onboarding-border-100 h-[46px] w-full "
                />
              </div>
            )}
          />

          <Button variant="primary" className="w-full mt-4" size="xl" type="submit" loading={isSubmitting}>
            {isSubmitting ? "Verifying..." : "Next step"}
          </Button>
        </div>
      </div>
    </form>
  );
};
