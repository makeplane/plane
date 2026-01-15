import { useEffect, useState } from "react";
import { CircleCheck, XCircle } from "lucide-react";
import { API_BASE_URL } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import { Input, Spinner } from "@plane/ui";
// constants
// helpers
import { EAuthModes } from "@/helpers/authentication.helper";
// hooks
import useTimer from "@/hooks/use-timer";
// services
import { AuthService } from "@/services/auth.service";

// services
const authService = new AuthService();

type TAuthUniqueCodeForm = {
  mode: EAuthModes;
  email: string;
  isExistingEmail: boolean;
  handleEmailClear: () => void;
  generateEmailUniqueCode: (email: string) => Promise<{ code: string } | undefined>;
  nextPath: string | undefined;
};

type TUniqueCodeFormValues = {
  email: string;
  code: string;
};

const defaultValues: TUniqueCodeFormValues = {
  email: "",
  code: "",
};

export function AuthUniqueCodeForm(props: TAuthUniqueCodeForm) {
  const { mode, email, handleEmailClear, generateEmailUniqueCode, isExistingEmail, nextPath } = props;
  // derived values
  const defaultResetTimerValue = 5;
  // states
  const [uniqueCodeFormData, setUniqueCodeFormData] = useState<TUniqueCodeFormValues>({ ...defaultValues, email });
  const [isRequestingNewCode, setIsRequestingNewCode] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // timer
  const { timer: resendTimerCode, setTimer: setResendCodeTimer } = useTimer(0);
  // plane hooks
  const { t } = useTranslation();

  const handleFormChange = (key: keyof TUniqueCodeFormValues, value: string) =>
    setUniqueCodeFormData((prev) => ({ ...prev, [key]: value }));

  const generateNewCode = async (email: string) => {
    try {
      setIsRequestingNewCode(true);
      const uniqueCode = await generateEmailUniqueCode(email);
      setResendCodeTimer(defaultResetTimerValue);
      handleFormChange("code", uniqueCode?.code || "");
      setIsRequestingNewCode(false);
    } catch {
      setResendCodeTimer(0);
      console.error("Error while requesting new code");
      setIsRequestingNewCode(false);
    }
  };

  useEffect(() => {
    if (csrfToken === undefined)
      authService.requestCSRFToken().then((data) => data?.csrf_token && setCsrfToken(data.csrf_token));
  }, [csrfToken]);

  const isRequestNewCodeDisabled = isRequestingNewCode || resendTimerCode > 0;
  const isButtonDisabled = isRequestingNewCode || !uniqueCodeFormData.code || isSubmitting;

  return (
    <form
      className="space-y-4"
      method="POST"
      action={`${API_BASE_URL}/auth/${mode === EAuthModes.SIGN_IN ? "magic-sign-in" : "magic-sign-up"}/`}
      onSubmit={() => {
        setIsSubmitting(true);
      }}
      onError={() => {
        setIsSubmitting(false);
      }}
    >
      <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
      <input type="hidden" value={uniqueCodeFormData.email} name="email" />
      {nextPath && <input type="hidden" value={nextPath} name="next_path" />}
      <div className="space-y-1">
        <label htmlFor="email" className="text-13 font-medium text-tertiary">
          {t("auth.common.email.label")}
        </label>
        <div className={`relative flex items-center rounded-md bg-surface-1 border border-strong`}>
          <Input
            id="email"
            name="email"
            type="email"
            value={uniqueCodeFormData.email}
            onChange={(e) => handleFormChange("email", e.target.value)}
            placeholder={t("auth.common.email.placeholder")}
            className="disable-autofill-style h-10 w-full placeholder:text-placeholder border-0"
            autoComplete="on"
            disabled
          />
          {uniqueCodeFormData.email.length > 0 && (
            <button
              type="button"
              className="absolute right-3 size-5 grid place-items-center"
              aria-label={t("aria_labels.auth_forms.clear_email")}
              onClick={handleEmailClear}
            >
              <XCircle className="size-5 stroke-placeholder" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="unique-code" className="text-13 font-medium text-tertiary">
          {t("auth.common.unique_code.label")}
        </label>
        <Input
          name="code"
          id="unique-code"
          value={uniqueCodeFormData.code}
          onChange={(e) => handleFormChange("code", e.target.value)}
          placeholder={t("auth.common.unique_code.placeholder")}
          className="disable-autofill-style h-10 w-full border border-strong !bg-surface-1 pr-12 placeholder:text-placeholder"
          autoFocus
        />
        <div className="flex w-full items-center justify-between px-1 text-11 pt-1">
          <p className="flex items-center gap-1 font-medium text-success-primary">
            <CircleCheck height={12} width={12} />
            {t("auth.common.unique_code.paste_code")}
          </p>
          <button
            type="button"
            onClick={() => generateNewCode(uniqueCodeFormData.email)}
            className={
              isRequestNewCodeDisabled
                ? "text-placeholder"
                : "font-medium text-accent-secondary hover:text-accent-secondary"
            }
            disabled={isRequestNewCodeDisabled}
          >
            {resendTimerCode > 0
              ? t("auth.common.resend_in", { seconds: resendTimerCode })
              : isRequestingNewCode
                ? t("auth.common.unique_code.requesting_new_code")
                : t("common.resend")}
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <Button type="submit" variant="primary" className="w-full" size="xl" disabled={isButtonDisabled}>
          {isRequestingNewCode ? (
            t("auth.common.unique_code.sending_code")
          ) : isSubmitting ? (
            <Spinner height="20px" width="20px" />
          ) : (
            t("common.continue")
          )}
        </Button>
      </div>
    </form>
  );
}
