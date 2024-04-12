import { FC, FormEvent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
// services
import { AuthService } from "@/services/auth.service";
// ui
import { Button, Checkbox, Input } from "@plane/ui";
// components
import { Banner, PasswordStrengthMeter } from "components/common";
// icons
import { Eye, EyeOff } from "lucide-react";
// helpers
import { API_BASE_URL, cn } from "@/helpers/common.helper";
import { getPasswordStrength } from "@/helpers/password.helper";

type TInstanceFormData = {
  first_name: string;
  last_name: string;
  email: string;
  company_name: string;
  password: string;
  is_telemetry_enabled: boolean;
};

const defaultInstanceFromData: TInstanceFormData = {
  first_name: "",
  last_name: "",
  email: "",
  company_name: "",
  password: "",
  is_telemetry_enabled: true,
};

type InstanceFormErrors = {
  general?: string;
  email: string;
  password: string;
};

const defaultInstanceFormErrors: InstanceFormErrors = {
  general: "",
  email: "",
  password: "",
};

// service initialization
const authService = new AuthService();

export const InstanceSignUpForm: FC = (props) => {
  const {} = props;
  // search params
  const searchParams = useSearchParams();
  // state
  const [csrfToken, setCsrfToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitDisabled, setSubmitDisabled] = useState(true);
  const [instanceFormData, setInstanceFormData] = useState<TInstanceFormData>(defaultInstanceFromData);
  const [instanceFormErrors, setInstanceFormErrors] = useState<InstanceFormErrors>(defaultInstanceFormErrors);

  const handleFormChange = (key: keyof TInstanceFormData, value: string | boolean) =>
    setInstanceFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    authService.requestCSRFToken().then((data) => setCsrfToken(data.csrf_token));
  }, []);

  useEffect(() => {
    if (
      instanceFormData.first_name &&
      instanceFormData.email &&
      instanceFormData.password &&
      getPasswordStrength(instanceFormData.password) >= 3
    ) {
      setSubmitDisabled(false);
    } else {
      setSubmitDisabled(true);
    }
  }, [instanceFormData]);

  useEffect(() => {
    const errorCode = searchParams.get("error_code");
    const errorMessage = searchParams.get("error_message");

    if (errorCode) {
      if (errorMessage) {
        if (errorCode === "INVALID_EMAIL") {
          setInstanceFormErrors((prev) => ({ ...prev, email: errorMessage }));
        } else if (errorCode === "INVALID_PASSWORD") {
          setInstanceFormErrors((prev) => ({ ...prev, password: errorMessage }));
        } else {
          setInstanceFormErrors((prev) => ({ ...prev, general: errorMessage }));
        }
      } else {
        setInstanceFormErrors((prev) => ({ ...prev, general: "Something went wrong. Please try again." }));
      }
    }
  }, [searchParams]);

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    console.log(event);
    // validating password
    event.preventDefault();
  };

  return (
    <div className="relative w-full h-full overflow-hidden container mx-auto px-5 md:px-0 flex justify-center items-center">
      <div className="w-full md:w-4/6 lg:w-3/6 xl:w-2/6 space-y-10">
        <div className="text-center space-y-1">
          <h3 className="text-3xl font-bold">Setup your Plane Instance</h3>
          <p className="font-medium text-custom-text-400">Post setup you will be able to manage this Plane instance.</p>
        </div>
        {!!instanceFormErrors.general && <Banner type="error" message={instanceFormErrors.general} />}
        <form
          className="space-y-4"
          method="POST"
          action={`${API_BASE_URL}/api/instances/admins/sign-up/`}
          onSubmit={handleFormSubmit}
        >
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
          <div className="flex items-center gap-4">
            <div className="w-full space-y-1">
              <label className="text-sm text-custom-text-300 font-medium" htmlFor="first_name">
                First name <span className="text-red-500">*</span>
              </label>
              <Input
                className="w-full"
                id="first_name"
                name="first_name"
                type="text"
                inputSize="md"
                placeholder="Wilber"
                value={instanceFormData.first_name}
                onChange={(e) => handleFormChange("first_name", e.target.value)}
              />
            </div>
            <div className="w-full space-y-1">
              <label className="text-sm text-custom-text-300 font-medium" htmlFor="last_name">
                Last name
              </label>
              <Input
                className="w-full"
                id="last_name"
                name="last_name"
                type="text"
                inputSize="md"
                placeholder="Wright"
                value={instanceFormData.last_name}
                onChange={(e) => handleFormChange("last_name", e.target.value)}
              />
            </div>
          </div>
          <div className="w-full space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <Input
              className="w-full"
              id="email"
              name="email"
              type="email"
              inputSize="md"
              placeholder="name@company.com"
              value={instanceFormData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              hasError={!!instanceFormErrors.email}
            />
            <p className="px-1 text-xs text-red-500">{instanceFormErrors.email}</p>
          </div>
          <div className="w-full space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="company_name">
              Company name
            </label>
            <Input
              className="w-full"
              id="company_name"
              name="company_name"
              type="text"
              inputSize="md"
              placeholder="Company name"
              value={instanceFormData.company_name}
              onChange={(e) => handleFormChange("company_name", e.target.value)}
            />
          </div>
          <div className="w-full space-y-1">
            <label className="text-sm text-custom-text-300 font-medium" htmlFor="password">
              Set a password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                className={cn("w-full pr-10")}
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                inputSize="md"
                placeholder="New password..."
                value={instanceFormData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                hasError={!!instanceFormErrors.password}
              />
              {showPassword ? (
                <button
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => setShowPassword(false)}
                >
                  <EyeOff className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className="absolute right-3 top-3.5 flex items-center justify-center text-custom-text-400"
                  onClick={() => setShowPassword(true)}
                >
                  <Eye className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="px-1 text-xs text-red-500">{instanceFormErrors.password}</p>
            <PasswordStrengthMeter password={instanceFormData.password} />
          </div>
          <div className="relative flex items-center pt-2 gap-2">
            <Checkbox
              id="is_telemetry_enabled"
              name="is_telemetry_enabled"
              value={instanceFormData.is_telemetry_enabled ? "True" : "False"}
              onChange={() => handleFormChange("is_telemetry_enabled", !instanceFormData.is_telemetry_enabled)}
              checked={instanceFormData.is_telemetry_enabled}
            />
            <label className="text-sm text-custom-text-300 font-medium cursor-pointer" htmlFor="is_telemetry_enabled">
              Allow Plane to anonymously collect usage events.
            </label>
            <a href="#" className="text-sm font-medium text-blue-500 hover:text-blue-600">
              See More
            </a>
          </div>
          <div className="py-2">
            <Button type="submit" size="lg" className="w-full" disabled={submitDisabled}>
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
