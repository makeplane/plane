import React, { useState, ReactElement } from "react";
import { useRouter } from "next/router";
import Image from "next/image";
import { useTheme } from "next-themes";
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
// layouts
import DefaultLayout from "layouts/default-layout";
import { UserAuthWrapper } from "layouts/auth-layout";
// components
import { CreateWorkspaceForm } from "components/workspace";
// images
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.svg";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.svg";
// types
import { IWorkspace } from "types";
import { NextPageWithLayout } from "types/app";

const CreateWorkspacePage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  // store
  const {
    user: { currentUser, updateCurrentUser },
  } = useMobxStore();
  // states
  const [defaultValues, setDefaultValues] = useState({
    name: "",
    slug: "",
    organization_size: "",
  });
  // hooks
  const { theme } = useTheme();

  const onSubmit = async (workspace: IWorkspace) => {
    await updateCurrentUser({ last_workspace_id: workspace.id }).then(() => router.push(`/${workspace.slug}`));
  };

  return (
    <div className="flex h-full flex-col gap-y-2 sm:gap-y-0 sm:flex-row overflow-hidden">
      <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
        <div className="absolute border-b-[0.5px] sm:border-r-[0.5px] border-custom-border-200 h-[0.5px] w-full top-1/2 left-0 -translate-y-1/2 sm:h-screen sm:w-[0.5px] sm:top-0 sm:left-1/2 md:left-1/3 sm:-translate-x-1/2 sm:translate-y-0" />
        <button
          className="absolute grid place-items-center bg-custom-background-100 px-3 sm:px-0 sm:py-5 left-5 sm:left-1/2 md:left-1/3 sm:-translate-x-[15px] top-1/2 -translate-y-1/2 sm:translate-y-0 sm:top-12"
          onClick={() => router.push("/")}
        >
          <div className="h-[30px] w-[133px]">
            {theme === "light" ? (
              <Image src={BlackHorizontalLogo} alt="Plane black logo" />
            ) : (
              <Image src={WhiteHorizontalLogo} alt="Plane white logo" />
            )}
          </div>
        </button>
        <div className="absolute sm:fixed text-custom-text-100 text-sm right-4 top-1/4 sm:top-12 -translate-y-1/2 sm:translate-y-0 sm:right-16 sm:py-5">
          {currentUser?.email}
        </div>
      </div>
      <div className="relative flex justify-center sm:justify-start sm:items-center h-full px-8 pb-8 sm:p-0 sm:pr-[8.33%] sm:w-10/12 md:w-9/12 lg:w-4/5">
        <div className="w-full space-y-7 sm:space-y-10">
          <h4 className="text-2xl font-semibold">Create your workspace</h4>
          <div className="sm:w-3/4 md:w-2/5">
            <CreateWorkspaceForm
              onSubmit={onSubmit}
              defaultValues={defaultValues}
              setDefaultValues={setDefaultValues}
            />
          </div>
        </div>
      </div>
    </div>
  );
});

CreateWorkspacePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <UserAuthWrapper>
      <DefaultLayout>{page} </DefaultLayout>
    </UserAuthWrapper>
  );
};

export default CreateWorkspacePage;
