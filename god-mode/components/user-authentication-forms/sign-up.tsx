import { FC, FormEvent, useEffect, useState } from "react";
// services
import { AuthService } from "@/services/auth.service";
import { API_BASE_URL } from "@/helpers/common.helper";

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
          <p className="font-medium text-gray-600">Post setup you will be able to manage this Plane instance.</p>
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
              <label className="text-sm text-gray-500 font-medium" htmlFor="first_name">
                First name <span className="text-red-500">*</span>
              </label>
              <input
                className="h-[40px] w-full border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                id="first_name"
                name="first_name"
                type="text"
                placeholder="Wilber"
                value={instanceFormData.first_name}
                onChange={(e) => handleFormChange("first_name", e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="w-full space-y-1">
              <label className="text-sm text-gray-500 font-medium" htmlFor="last_name">
                last name
              </label>
              <input
                className="h-[40px] w-full border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
                id="last_name"
                name="last_name"
                type="text"
                placeholder="Wright"
                value={instanceFormData.last_name}
                onChange={(e) => handleFormChange("last_name", e.target.value)}
              />
            </div>
          </div>
          <div className="w-full space-y-1">
            <label className="text-sm text-gray-500 font-medium" htmlFor="email">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              className="h-[40px] w-full border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
              id="email"
              name="email"
              type="email"
              placeholder="name@company.com"
              value={instanceFormData.email}
              onChange={(e) => handleFormChange("email", e.target.value)}
              required
            />
          </div>
          <div className="w-full space-y-1">
            <label className="text-sm text-gray-500 font-medium" htmlFor="company_name">
              Company name
            </label>
            <input
              className="h-[40px] w-full border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
              id="company_name"
              name="company_name"
              type="text"
              placeholder="Company name"
              value={instanceFormData.company_name}
              onChange={(e) => handleFormChange("company_name", e.target.value)}
            />
          </div>
          <div className="w-full space-y-1">
            <label className="text-sm text-gray-500 font-medium" htmlFor="password">
              Set a password <span className="text-red-500">*</span>
            </label>
            <input
              className="h-[40px] w-full border border-gray-300 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-gray-300 transition-all"
              id="password"
              name="password"
              type="text"
              placeholder="New password..."
              value={instanceFormData.password}
              onChange={(e) => handleFormChange("password", e.target.value)}
              required
            />
          </div>
          <div className="relative flex items-center gap-1">
            <div className="relative flex items-center gap-1">
              <input
                className="h-[40px] transition-all"
                id="is_telemetry_enabled"
                name="is_telemetry_enabled"
                type="checkbox"
                placeholder="Wright"
                value={instanceFormData.is_telemetry_enabled ? "True" : "False"}
                onChange={() => handleFormChange("is_telemetry_enabled", !instanceFormData.is_telemetry_enabled)}
                checked={instanceFormData.is_telemetry_enabled}
              />
              <label className="text-sm text-gray-500 font-medium cursor-pointer" htmlFor="is_telemetry_enabled">
                Allow Plane to anonymously collect usage events.
              </label>
            </div>
            <a href="#" className="text-sm font-medium text-blue-500 hover:text-blue-600">
              See More
            </a>
          </div>
          <div>
            <button
              type="submit"
              className="rounded font-medium px-3 py-2 bg-blue-500 hover:bg-blue-600 transition-all flex w-full justify-center text-white shadow-sm focus:outline-none"
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
