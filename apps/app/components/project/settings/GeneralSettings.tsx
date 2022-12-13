// react
import { useCallback } from "react";
// react-hook-form
import { UseFormRegister, UseFormSetError } from "react-hook-form";
// services
import projectServices from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Button, Input, Select, TextArea } from "ui";
// types
import { IProject } from "types";
// constants
import { debounce } from "constants/common";

type Props = {
  register: UseFormRegister<IProject>;
  errors: any;
  setError: UseFormSetError<IProject>;
  isSubmitting: boolean;
};

const NETWORK_CHOICES = { "0": "Secret", "2": "Public" };

const GeneralSettings: React.FC<Props> = ({ register, errors, setError, isSubmitting }) => {
  const { activeWorkspace } = useUser();

  const checkIdentifier = (slug: string, value: string) => {
    projectServices.checkProjectIdentifierAvailability(slug, value).then((response) => {
      console.log(response);
      if (response.exists) setError("identifier", { message: "Identifier already exists" });
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkIdentifierAvailability = useCallback(debounce(checkIdentifier, 1500), []);

  return (
    <>
      <section className="space-y-5">
        <div>
          <h3 className="text-lg font-medium leading-6 text-gray-900">General</h3>
          <p className="mt-1 text-sm text-gray-500">
            This information will be displayed to every member of the project.
          </p>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="col-span-2">
            <Input
              id="name"
              name="name"
              error={errors.name}
              register={register}
              placeholder="Project Name"
              label="Name"
              validations={{
                required: "Name is required",
              }}
            />
          </div>
          <div>
            <Select
              name="network"
              id="network"
              options={Object.keys(NETWORK_CHOICES).map((key) => ({
                value: key,
                label: NETWORK_CHOICES[key as keyof typeof NETWORK_CHOICES],
              }))}
              label="Network"
              register={register}
              validations={{
                required: "Network is required",
              }}
            />
          </div>
          <div>
            <Input
              id="identifier"
              name="identifier"
              error={errors.identifier}
              register={register}
              placeholder="Enter identifier"
              label="Identifier"
              onChange={(e: any) => {
                if (!activeWorkspace || !e.target.value) return;
                checkIdentifierAvailability(activeWorkspace.slug, e.target.value);
              }}
              validations={{
                required: "Identifier is required",
                minLength: {
                  value: 1,
                  message: "Identifier must at least be of 1 character",
                },
                maxLength: {
                  value: 9,
                  message: "Identifier must at most be of 9 characters",
                },
              }}
            />
          </div>
        </div>
        <div>
          <TextArea
            id="description"
            name="description"
            error={errors.description}
            register={register}
            label="Description"
            placeholder="Enter project description"
            validations={{
              required: "Description is required",
            }}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating Project..." : "Update Project"}
          </Button>
        </div>
      </section>
    </>
  );
};

export default GeneralSettings;
