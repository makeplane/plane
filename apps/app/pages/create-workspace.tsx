import React from "react";

import { useRouter } from "next/router";
import Image from "next/image";
// hooks
import useUser from "hooks/use-user";
// components
import { OnboardingLogo } from "components/onboarding";
// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthorizationLayout } from "layouts/auth-layout/user-authorization-wrapper";
// images
import Logo from "public/onboarding/logo.svg";
// types
import type { NextPage } from "next";
// constants
import { CreateWorkspaceForm } from "components/workspace";

const CreateWorkspace: NextPage = () => {
  const router = useRouter();
  const defaultValues = {
    name: "",
    slug: "",
    company_size: null,
  };

  const { user } = useUser();
  return (
    <UserAuthorizationLayout>
      <DefaultLayout>
        <div className="relative grid h-full place-items-center p-5">
          <div className="h-full flex flex-col items-center justify-center w-full py-4">
            <div className="mb-7 flex items-center justify-center text-center">
              <OnboardingLogo className="h-12 w-48 fill-current text-custom-text-100" />
            </div>

            <div className="flex h-[366px] w-full max-w-xl flex-col justify-between rounded-[10px] bg-custom-background-100 shadow-md">
              <div className="flex items-center justify-start gap-3 px-7 pt-7 pb-3.5 text-gray-8 text-sm">
                <div className="flex flex-col gap-2 justify-center ">
                  <h3 className="text-base font-semibold text-custom-text-100">Create Workspace</h3>
                  <p className="text-sm text-custom-text-200">
                    Create or join the workspace to get started with Plane.
                  </p>
                </div>
              </div>
              <CreateWorkspaceForm
                defaultValues={defaultValues}
                setDefaultValues={() => {}}
                onSubmit={(res) => router.push(`/${res.slug}`)}
                user={user}
              />
            </div>
          </div>

          <div className="absolute flex flex-col gap-1 justify-center items-start left-5 top-5">
            <span className="text-xs text-custom-text-200">Logged in:</span>
            <span className="text-sm text-custom-text-100">{user?.email}</span>
          </div>
        </div>
      </DefaultLayout>
    </UserAuthorizationLayout>
  );
};

export default CreateWorkspace;
