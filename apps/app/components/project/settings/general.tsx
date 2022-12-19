// react
import { useCallback } from "react";
// react-hook-form
import { Controller } from "react-hook-form";
import type { Control, UseFormRegister, UseFormSetError } from "react-hook-form";
// services
import projectServices from "lib/services/project.service";
// hooks
import useUser from "lib/hooks/useUser";
// ui
import { Button, Input, Select, TextArea, EmojiIconPicker } from "ui";
// types
import { IProject } from "types";
// constants
import { debounce } from "constants/common";

type Props = {
  register: UseFormRegister<IProject>;
  errors: any;
  setError: UseFormSetError<IProject>;
  isSubmitting: boolean;
  control: Control<IProject, any>;
};

const NETWORK_CHOICES = { "0": "Secret", "2": "Public" };

const GeneralSettings: React.FC<Props> = ({
  register,
  errors,
  setError,
  isSubmitting,
  control,
}) => {
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
      <section className="space-y-8">
        <div>
          <h3 className="text-3xl font-bold leading-6 text-gray-900">General</h3>
          <p className="mt-4 text-sm text-gray-500">
            This information will be displayed to every member of the project.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-16">
          <div>
            <h4 className="text-md leading-6 text-gray-900 mb-1">Icon & Name</h4>
            <p className="text-sm text-gray-500 mb-3">Select an icon and a name for the project.</p>
            <div className="flex gap-2">
              <Controller
                control={control}
                name="icon"
                render={({ field: { value, onChange } }) => (
                  <EmojiIconPicker
                    label={value ? String.fromCodePoint(parseInt(value)) : "Icon"}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
              <Input
                id="name"
                name="name"
                error={errors.name}
                register={register}
                placeholder="Project Name"
                size="lg"
                className="w-auto"
                validations={{
                  required: "Name is required",
                }}
              />
            </div>
          </div>
          <div>
            <h4 className="text-md leading-6 text-gray-900 mb-1">Description</h4>
            <p className="text-sm text-gray-500 mb-3">Give a description to the project.</p>
            <TextArea
              id="description"
              name="description"
              error={errors.description}
              register={register}
              placeholder="Enter project description"
              validations={{
                required: "Description is required",
              }}
            />
          </div>
          <div>
            <h4 className="text-md leading-6 text-gray-900 mb-1">Identifier</h4>
            <p className="text-sm text-gray-500 mb-3">
              Create a 1-6 characters{"'"} identifier for the project.
            </p>
            <Input
              id="identifier"
              name="identifier"
              error={errors.identifier}
              register={register}
              placeholder="Enter identifier"
              className="w-40"
              size="lg"
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
          <div>
            <h4 className="text-md leading-6 text-gray-900 mb-1">Network</h4>
            <p className="text-sm text-gray-500 mb-3">Select privacy type for the project.</p>
            <Select
              name="network"
              id="network"
              options={Object.keys(NETWORK_CHOICES).map((key) => ({
                value: key,
                label: NETWORK_CHOICES[key as keyof typeof NETWORK_CHOICES],
              }))}
              size="lg"
              register={register}
              validations={{
                required: "Network is required",
              }}
              className="w-40"
            />
          </div>
        </div>
        <div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Updating Project..." : "Update Project"}
          </Button>
        </div>
      </section>
    </>
  );
};

export default GeneralSettings;
