import React, { useEffect, useState } from "react";

import { useRouter } from "next/router";
import Image from "next/image";

import { mutate } from "swr";

// react-hook-form
import { Controller, useForm } from "react-hook-form";
// services
import workspaceService from "services/workspace.service";
// hooks
import useToast from "hooks/use-toast";
// constants
import { requiredAuth } from "lib/auth";
// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { CustomSelect, Input } from "components/ui";
// images
import Logo from "public/onboarding/logo.svg";
// types
import type { IWorkspace } from "types";
import type { NextPage, NextPageContext } from "next";
// fetch-keys
import { USER_WORKSPACES } from "constants/fetch-keys";
// constants
import { companySize } from "constants/";

const defaultValues = {
  name: "",
  slug: "",
  company_size: null,
};

const CreateWorkspace: NextPage = () => {
  const [slugError, setSlugError] = useState(false);

  const router = useRouter();

  const { setToastAlert } = useToast();

  const {
    register,
    handleSubmit,
    control,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<IWorkspace>({ defaultValues });

  const onSubmit = async (formData: IWorkspace) => {
    await workspaceService
      .workspaceSlugCheck(formData.slug)
      .then(async (res) => {
        if (res.status === true) {
          setSlugError(false);
          await workspaceService
            .createWorkspace(formData)
            .then((res) => {
              setToastAlert({
                type: "success",
                title: "Success!",
                message: "Workspace created successfully.",
              });
              mutate<IWorkspace[]>(USER_WORKSPACES, (prevData) => [res, ...(prevData ?? [])]);
              router.push(`/${formData.slug}`);
            })
            .catch((err) => {
              console.error(err);
            });
        } else setSlugError(true);
      })
      .catch((err) => {
        Object.keys(err).map((key) => {
          const errorMessage = err?.[key];
          if (!errorMessage) return;
          setError(key as keyof IWorkspace, {
            message: Array.isArray(errorMessage) ? errorMessage.join(", ") : errorMessage,
          });
        });
      });
  };

  useEffect(() => {
    reset(defaultValues);
  }, [reset]);

  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-5">
        <div className="w-full space-y-4">
          <div className="text-center">
            <Image src={Logo} height="40" alt="Plane Logo" />
          </div>
          <div className="grid w-full place-items-center">
            <div className="w-full rounded-lg bg-white p-8 md:w-2/5">
              <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
                <div className="w-full space-y-4 bg-white">
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Input
                        name="name"
                        register={register}
                        label="Workspace name"
                        placeholder="Enter name"
                        autoComplete="off"
                        onChange={(e) =>
                          setValue("slug", e.target.value.toLocaleLowerCase().replace(/ /g, "-"))
                        }
                        validations={{
                          required: "Workspace name is required",
                        }}
                        error={errors.name}
                      />
                    </div>
                    <div>
                      <h6 className="text-gray-500">Workspace slug</h6>
                      <div className="flex items-center rounded-md border border-gray-300 px-3">
                        <span className="text-sm text-slate-600">{"https://app.plane.so/"}</span>
                        <Input
                          mode="trueTransparent"
                          autoComplete="off"
                          name="slug"
                          register={register}
                          className="block w-full rounded-md bg-transparent py-2 px-0 text-sm"
                        />
                      </div>
                      {slugError && (
                        <span className="-mt-3 text-sm text-red-500">
                          Workspace URL is already taken!
                        </span>
                      )}
                    </div>
                    <div>
                      <Controller
                        name="company_size"
                        control={control}
                        rules={{ required: "This field is required" }}
                        render={({ field: { value, onChange } }) => (
                          <CustomSelect
                            value={value}
                            onChange={onChange}
                            label={value ? value.toString() : "Select company size"}
                            input
                          >
                            {companySize?.map((item) => (
                              <CustomSelect.Option key={item.value} value={item.value}>
                                {item.label}
                              </CustomSelect.Option>
                            ))}
                          </CustomSelect>
                        )}
                      />
                      {errors.company_size && (
                        <span className="text-sm text-red-500">{errors.company_size.message}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mx-auto h-1/4 lg:w-1/2">
                  <button
                    type="submit"
                    className="w-full rounded-md bg-gray-200 px-4 py-2 text-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Continue"}
                  </button>
                </div>
              </form>
            </div>
          </div>
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
