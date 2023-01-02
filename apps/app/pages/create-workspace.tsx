import React from "react";
// next
import type { NextPage, NextPageContext } from "next";
import { useRouter } from "next/router";
// react hook form
import { useForm } from "react-hook-form";
// services
import workspaceService from "lib/services/workspace.service";
// hooks
import useUser from "lib/hooks/useUser";
// constants
import { requiredAuth } from "lib/auth";
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

  return (
    <DefaultLayout>
      <div className="flex h-full w-full flex-col items-center justify-center px-4">
        {user && (
          <div className="mb-10 w-96 rounded-lg bg-indigo-100 p-2 text-theme lg:mb-20">
            <p className="text-center text-sm">logged in as {user.email}</p>
          </div>
        )}
        <div className="flex w-full flex-col justify-between space-y-4 rounded border bg-white p-4 px-6 md:w-2/3 lg:w-1/3">
          <h2 className="mb-4 text-center text-2xl font-medium">Create a new workspace</h2>
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

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default CreateWorkspace;
