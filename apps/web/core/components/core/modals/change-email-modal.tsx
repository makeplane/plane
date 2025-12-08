import React, { useState } from "react";
import { observer } from "mobx-react";
import { Controller, useForm } from "react-hook-form";
import { Transition, Dialog } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Input } from "@plane/ui";
import { cn } from "@plane/utils";
// helpers
import { authErrorHandler } from "@/helpers/authentication.helper";
import type { EAuthenticationErrorCodes } from "@/helpers/authentication.helper";
// hooks
import { useUser } from "@/hooks/store/user";
// services
import { AuthService } from "@/services/auth.service";
import userService from "@/services/user.service";

type Props = { isOpen: boolean; onClose: () => void };

type TModalStep = "EMAIL" | "UNIQUE_CODE";
type TUniqueCodeValuesForm = { email: string; code: string };

const defaultValues: TUniqueCodeValuesForm = { email: "", code: "" };

// service initialization
const authService = new AuthService();

export const ChangeEmailModal = observer(function ChangeEmailModal(props: Props) {
  const { isOpen, onClose } = props;
  // states
  const [currentStep, setCurrentStep] = useState<TModalStep>("EMAIL");
  // store hooks
  const { signOut } = useUser();
  const { t } = useTranslation();
  const changeEmailT = (path: string) => t(`account_settings.profile.change_email_modal.${path}`);
  // form info
  const {
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TUniqueCodeValuesForm>({ defaultValues });

  const secondStep = currentStep === "UNIQUE_CODE";

  const handleClose = () => {
    reset({ ...defaultValues });
    setCurrentStep("EMAIL");
    onClose();
  };

  const handleSignOut = async () => {
    await signOut().catch(() =>
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("sign_out.toast.error.title"),
        message: t("sign_out.toast.error.message"),
      })
    );
  };

  const onSubmit = async (formData: TUniqueCodeValuesForm) => {
    if (currentStep === "UNIQUE_CODE") {
      // Step 2: Verify the code and update email
      try {
        await userService.verifyEmailCode({ email: formData.email, code: formData.code });

        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: changeEmailT("toasts.success_title"),
          message: changeEmailT("toasts.success_message"),
        });

        // Sign out the user after successful email update
        await handleSignOut();
        handleClose();
      } catch (error: unknown) {
        const errorMessage =
          (error as { error?: string; message?: string })?.error ||
          (error as { error?: string; message?: string })?.message ||
          changeEmailT("form.code.errors.invalid");
        setError("code", { type: "custom", message: errorMessage });
      }
      return;
    }

    // Step 1: Check email and generate verification code
    try {
      // Get CSRF token
      const csrfToken = await authService.requestCSRFToken().then((data) => data?.csrf_token);
      if (!csrfToken) throw new Error("CSRF token not found");

      // Check if email is available
      const emailCheckResponse = await userService.checkEmail(csrfToken, formData.email);

      // Check if email already exists
      if (emailCheckResponse?.existing === true) {
        setError("email", { type: "custom", message: changeEmailT("form.email.errors.exists") });
        return;
      }

      // Generate verification code and send to new email
      await userService.generateEmailCode({ email: formData.email });

      // Move to verification code step
      setCurrentStep("UNIQUE_CODE");
    } catch (error: unknown) {
      // Extract error code and message from backend response
      const err = error as { error_code?: number | string; error_message?: string };
      const errorCode = err?.error_code?.toString();

      // Use authErrorHandler to get user-friendly error message
      const errorInfo = errorCode ? authErrorHandler(errorCode as EAuthenticationErrorCodes) : undefined;

      // Get error message from handler or fallback
      const errorMessage = errorInfo
        ? typeof errorInfo.message === "string"
          ? errorInfo.message
          : String(errorInfo.message)
        : err?.error_message || changeEmailT("form.email.errors.validation_failed");

      setError("email", { type: "custom", message: errorMessage });
    }
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-30" onClose={handleClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 transition-opacity bg-custom-backdrop" />
        </Transition.Child>

        <div className="overflow-y-auto fixed inset-0 z-30">
          <div className="flex justify-center items-center p-4 min-h-full text-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-custom-background-100 px-4 text-left shadow-custom-shadow-md transition-all sm:my-8 sm:w-[30rem]">
                <div className="py-4 space-y-0">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-custom-text-100">
                    {changeEmailT("title")}
                  </Dialog.Title>
                  <p className="my-4 text-sm text-custom-text-200">{changeEmailT("description")}</p>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
                  <div className="flex flex-col gap-1">
                    {secondStep && (
                      <h4 className="text-sm font-medium text-custom-text-200">{changeEmailT("form.email.label")}</h4>
                    )}
                    <Controller
                      control={control}
                      name="email"
                      rules={{
                        required: changeEmailT("form.email.errors.required"),
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: changeEmailT("form.email.errors.invalid"),
                        },
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
                          placeholder={changeEmailT("form.email.placeholder")}
                          className={cn(
                            { "border-red-500": errors.email },
                            { "cursor-not-allowed !bg-custom-background-90": secondStep }
                          )}
                          disabled={secondStep}
                        />
                      )}
                    />
                    {errors?.email && <span className="text-xs text-red-500">{errors?.email?.message}</span>}
                  </div>

                  {secondStep && (
                    <div className="flex flex-col gap-1">
                      <h4 className="text-sm font-medium text-custom-text-200">{changeEmailT("form.code.label")}</h4>
                      <Controller
                        control={control}
                        name="code"
                        rules={{ required: changeEmailT("form.code.errors.required") }}
                        render={({ field: { value, onChange, ref } }) => (
                          <Input
                            id="code"
                            name="code"
                            value={value}
                            onChange={onChange}
                            ref={ref}
                            placeholder={changeEmailT("form.code.placeholder")}
                            className={cn({ "border-red-500": errors.code })}
                            autoFocus
                          />
                        )}
                      />
                      {errors?.code ? (
                        <span className="text-xs text-red-500">{errors?.code?.message}</span>
                      ) : (
                        <span className="text-xs text-green-700">{changeEmailT("form.code.helper_text")}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-2 border-t-[0.5px] border-custom-border-200 py-4">
                    <Button type="button" variant="neutral-primary" size="sm" onClick={handleClose}>
                      {changeEmailT("actions.cancel")}
                    </Button>
                    <Button type="submit" variant="primary" size="sm" disabled={isSubmitting}>
                      {isSubmitting
                        ? changeEmailT("states.sending")
                        : secondStep
                          ? changeEmailT("actions.confirm")
                          : changeEmailT("actions.continue")}
                    </Button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
});
