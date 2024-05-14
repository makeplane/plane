import { FC, FormEvent, useEffect, useState } from "react";
// services
import { AuthService } from "@/services/auth.service";
import { API_BASE_URL } from "@/helpers/common.helper";
// ui
import { Button, Checkbox, Input } from "@plane/ui";
import { PasswordStrengthMeter } from "components/common";
import { Eye, EyeOff } from "lucide-react";

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

// service initialization
const authService = new AuthService();

export const InstanceSignUpForm: FC = (props) => {
  const {} = props;
  // state
  const [csrfToken, setCsrfToken] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [instanceFormData, setInstanceFormData] = useState<TInstanceFormData>(defaultInstanceFromData);

  const handleFormChange = (key: keyof TInstanceFormData, value: string | boolean) =>
    setInstanceFormData((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    authService.requestCSRFToken().then((data) => setCsrfToken(data.csrf_token));
  }, []);

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
                required
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
              required
            />
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
                className="w-full"
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                inputSize="md"
                placeholder="New password..."
                value={instanceFormData.password}
                onChange={(e) => handleFormChange("password", e.target.value)}
                required
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
            <Button type="submit" size="lg" className="w-full">
              Continue
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
