"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// plane web hooks
import { useLinearImporter } from "@/plane-web/hooks/store";
// plane web components
import { AuthFormInput, TAuthFormInputFormField } from "@/plane-web/silo/ui/auth-form-input";
// plane web types
import { TLinearPATFormFields } from "@/plane-web/types/importers/linear";

export const PersonalAccessTokenAuth: FC = observer(() => {
  // hooks
  const {
    auth: { authWithPAT },
  } = useLinearImporter();

  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<TLinearPATFormFields>({
    personalAccessToken: "",
  });

  // handlers
  const handleFormData = <T extends keyof TLinearPATFormFields>(key: T, value: TLinearPATFormFields[T]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const clearFromData = () => {
    setFormData({
      personalAccessToken: "",
    });
  };

  const handlePATAuthentication = async () => {
    try {
      setIsLoading(true);
      await authWithPAT(formData);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.toString() || "Something went wrong while authorizing Linear",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // LINEAR PAT form fields
  const linearPatFormFields: TAuthFormInputFormField[] = [
    {
      key: "LINEAR_PAT",
      type: "password",
      label: "Personal Access Token",
      value: formData.personalAccessToken,
      onChange: (e) => handleFormData("personalAccessToken", e.target.value),
      description: (
        <>
          You will get this from your{" "}
          <a
            tabIndex={-1}
            href="https://developers.linear.app/docs/graphql/working-with-the-graphql-api#personal-api-keys"
            target="_blank"
            className="text-custom-primary-100 hover:underline"
            rel="noreferrer"
          >
            Linear Security settings.
          </a>
        </>
      ),
      placeholder: "lin_api_h6C1asD1s6",
      error: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative flex flex-col border-b border-custom-border-100 pb-3.5">
        <h3 className="text-xl font-medium">Linear to Plane Migration Assistant</h3>
        <p className="text-custom-text-300 text-sm">
          Seamlessly migrate your Linear projects to Plane with our powerful assistant.
        </p>
      </div>
      <div className="space-y-6">
        {linearPatFormFields.map((field) => (
          <AuthFormInput
            key={field.key}
            type={field.type}
            name={field.key}
            label={field.label}
            value={field.value}
            onChange={field.onChange}
            description={field.description}
            placeholder={field.placeholder}
            error={field.error}
          />
        ))}
        <div className="relative flex justify-end gap-4">
          <Button variant="link-neutral" className="font-medium" onClick={clearFromData} disabled={isLoading}>
            Clear
          </Button>
          <Button variant="primary" onClick={handlePATAuthentication} disabled={isLoading}>
            {isLoading ? "Authorizing" : "Connect Linear"}
          </Button>
        </div>
      </div>
    </div>
  );
});
