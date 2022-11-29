import React from "react";
// next
import type { NextPage } from "next";
import { useRouter } from "next/router";
// react hook form
import { useForm } from "react-hook-form";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
// layouts
import DefaultLayout from "layouts/DefaultLayout";
// ui
import { Input, Button, Select } from "ui";
// types
import type { IWorkspace } from "types";

const CreateWorkspace: NextPage = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({
    defaultValues: {
      name: "",
    },
  });

  const router = useRouter();

  const { mutateWorkspaces, user } = useUser();

  const onSubmit = async (formData: IWorkspace) => {
    await workspaceService
      .createWorkspace(formData)
      .then((res) => {
        console.log(res);
        mutateWorkspaces((prevData) => [...(prevData ?? []), res], false);
        router.push("/");
      })
      .catch((err) => {
        Object.keys(err).map((key) => {
          const errorMessage = err[key];
          setError(key as keyof IWorkspace, {
            message: Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage,
          });
        });
      });
  };

  // const workspaceName = watch("name") ?? "";

  // useEffect(() => {
  //   workspaceName && workspaceName !== ""
  //     ? setValue(
  //         "url",
  //         `${window.location.origin}/${workspaceName
  //           .toLowerCase()
  //           .replace(/ /g, "")}`
  //       )
  //     : setValue("url", workspaceName);
  // }, [workspaceName, setValue]);

  return (
    <DefaultLayout>
      <div className="flex flex-col items-center justify-center w-full h-full px-4">
        {user && (
          <div className="w-96 p-2 rounded-lg bg-indigo-100 text-indigo-600 mb-10 lg:mb-20">
            <p className="text-sm text-center">logged in as {user.email}</p>
          </div>
        )}
        <div className="rounded border p-4 px-6 w-full md:w-2/3 lg:w-1/3 space-y-4 flex flex-col justify-between bg-white">
          <h2 className="text-2xl text-center font-medium mb-4">Create a new workspace</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              <div>
                <Input
                  id="name"
                  label="Workspace Name"
                  name="name"
                  autoComplete="off"
                  register={register}
                  validations={{
                    required: "Name is required",
                  }}
                  error={errors.name}
                  placeholder="Enter workspace name"
                />
              </div>
              <div>
                <Input
                  id="url"
                  label="Workspace URL"
                  name="url"
                  autoComplete="off"
                  validations={{
                    required: "URL is required",
                  }}
                  placeholder="Enter workspace URL"
                />
              </div>
              <div>
                <Select
                  id="size"
                  name="company_size"
                  label="How large is your company?"
                  register={register}
                  options={[
                    { value: 5, label: "5" },
                    { value: 10, label: "10" },
                    { value: 25, label: "25" },
                    { value: 50, label: "50" },
                  ]}
                />
              </div>
              <div>
                <Input
                  id="projects"
                  label="What is your role?"
                  name="projects"
                  autoComplete="off"
                  placeholder="Head of Engineering"
                />
              </div>
              {/* <div>
          <TextArea
            id="description"
            label="Description"
            name="description"
            register={register}
            error={errors.description}
            placeholder="Enter workspace description"
          />
        </div> */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Creating Workspace..." : "Create Workspace"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default CreateWorkspace;
