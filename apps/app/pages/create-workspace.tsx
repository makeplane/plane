import React from "react";

import { useRouter } from "next/router";

// hooks
import useUser from "hooks/use-user";
// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthorizationLayout } from "layouts/auth-layout/user-authorization-wrapper";
// types
import type { NextPage } from "next";
// constants
import { CreateWorkspaceForm } from "components/workspace";
import { ICurrentUserResponse, IWorkspace } from "types";
import { mutate } from "swr";
import { CURRENT_USER } from "constants/fetch-keys";
import userService from "services/user.service";

const CreateWorkspace: NextPage = () => {
  const router = useRouter();
  const defaultValues = {
    name: "",
    slug: "",
    organization_size: "2-10",
  };

  const { user } = useUser();

  const onSubmit = (workspace: IWorkspace) => {
    mutate<ICurrentUserResponse>(
      CURRENT_USER,
      (prevData) => {
        if (!prevData) return prevData;

        return {
          ...prevData,
          last_workspace_id: workspace.id,
          workspace: {
            ...prevData.workspace,
            fallback_workspace_id: workspace.id,
            fallback_workspace_slug: workspace.slug,
            last_workspace_id: workspace.id,
            last_workspace_slug: workspace.slug,
          },
        };
      },
      false
    );

    userService
      .updateUser({ last_workspace_id: workspace.id })
      .then(() => router.push(`/${workspace.slug}`));
  };

  return (
    <UserAuthorizationLayout>
      <DefaultLayout>
        <div className="relative grid h-full place-items-center p-5">
          <div className="h-full flex flex-col items-center justify-center w-full py-4">
            <div className="mb-7 flex items-center justify-center text-center">
              {/* <OnboardingLogo className="h-12 w-48 fill-current text-brand-base" /> */}
            </div>

            <div className="flex h-[366px] w-full max-w-xl flex-col justify-between rounded-[10px] bg-brand-base shadow-md">
              <div className="flex items-center justify-start gap-3 px-7 pt-7 pb-3.5 text-gray-8 text-sm">
                <div className="flex flex-col gap-2 justify-center ">
                  <h3 className="text-base font-semibold text-brand-base">Create Workspace</h3>
                  <p className="text-sm text-brand-secondary">
                    Create or join the workspace to get started with Plane.
                  </p>
                </div>
              </div>
              <CreateWorkspaceForm
                defaultValues={defaultValues}
                setDefaultValues={() => {}}
                onSubmit={onSubmit}
                user={user}
              />
            </div>
          </div>

          <div className="absolute flex flex-col gap-1 justify-center items-start left-5 top-5">
            <span className="text-xs text-brand-secondary">Logged in:</span>
            <span className="text-sm text-brand-base">{user?.email}</span>
          </div>
        </div>
      </DefaultLayout>
    </UserAuthorizationLayout>
  );
};

export default CreateWorkspace;
