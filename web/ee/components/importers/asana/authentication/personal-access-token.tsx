"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import { Button, setToast, TOAST_TYPE } from "@plane/ui";
// plane web hooks
import { useAsanaImporter } from "@/plane-web/hooks/store";
// plane web components
import { AuthFormInput, TAuthFormInputFormField } from "@/plane-web/silo/ui/auth-form-input";
// plane web types
import { TAsanaPATFormFields } from "@/plane-web/types/importers/asana";

export const PersonalAccessTokenAuth: FC = observer(() => {
  // hooks
  const {
    auth: { authWithPAT },
  } = useAsanaImporter();
  // states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<TAsanaPATFormFields>({
    personalAccessToken: "",
  });

  // handlers
  const handleFormData = <T extends keyof TAsanaPATFormFields>(key: T, value: TAsanaPATFormFields[T]) => {
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
    } catch (error: any) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.message?.toString() || "Something went wrong while authorizing Asana",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // constants
  const asanaPatFormFields: TAuthFormInputFormField[] = [
    {
      key: "ASANA_PAT",
      type: "password",
      label: "Personal Access Token",
      value: formData.personalAccessToken,
      onChange: (e) => handleFormData("personalAccessToken", e.target.value),
      description: (
        <>
          You will get this from your{" "}
          <a
            tabIndex={-1}
            href="https://app.asana.com/0/my-apps"
            target="_blank"
            className="text-custom-primary-100 hover:underline"
            rel="noreferrer"
          >
            Asana Developer Settings.
          </a>
        </>
      ),
      placeholder: "2/120823490290309127/12028932342561120:ac2829783JS07d72b0c5fc998af0a0",
      error: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="relative flex flex-col border-b border-custom-border-100 pb-3.5">
        <h3 className="text-xl font-medium">Asana to Plane Migration Assistant</h3>
        <p className="text-custom-text-300 text-sm">
          Seamlessly migrate your Asana projects to Plane with our powerful assistant.
        </p>
      </div>
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-x-12 gap-y-8 w-full">
          {asanaPatFormFields.map((field) => (
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
        </div>
        <div className="relative flex justify-end gap-4">
          <Button variant="link-neutral" className="font-medium" onClick={clearFromData}>
            Clear
          </Button>
          <Button variant="primary" onClick={handlePATAuthentication} loading={isLoading} disabled={isLoading}>
            {isLoading ? "Authorizing" : "Connect Asana"}
          </Button>
        </div>
      </div>
    </div>
  );
});
