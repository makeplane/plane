import { ReactElement, useState } from "react";
import { observer } from "mobx-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { IWorkspace } from "@plane/types";
// hooks
import { PageHead } from "@/components/core";
import { CreateWorkspaceForm } from "@/components/workspace";
import { useUser, useUserProfile } from "@/hooks/store";
// layouts
import DefaultLayout from "@/layouts/default-layout";
// components
// images
import { NextPageWithLayout } from "@/lib/types";
// wrappers
import { AuthenticationWrapper } from "@/lib/wrappers";
import BlackHorizontalLogo from "public/plane-logos/black-horizontal-with-blue-logo.png";
import WhiteHorizontalLogo from "public/plane-logos/white-horizontal-with-blue-logo.png";
// types

const CreateWorkspacePage: NextPageWithLayout = observer(() => {
  // router
  const router = useRouter();
  // store hooks
  const { data: currentUser } = useUser();
  const { updateUserProfile } = useUserProfile();
  // states
  const [defaultValues, setDefaultValues] = useState({
    name: "",
    slug: "",
    organization_size: "",
  });
  // hooks
  const { resolvedTheme } = useTheme();

  const onSubmit = async (workspace: IWorkspace) => {
    await updateUserProfile({ last_workspace_id: workspace.id }).then(() => router.push(`/${workspace.slug}`));
  };

  const logo = resolvedTheme === "light" ? BlackHorizontalLogo : WhiteHorizontalLogo;

  return (
    <>
      <PageHead title="Create Workspace" />
      <div className="flex h-full flex-col gap-y-2 overflow-hidden sm:flex-row sm:gap-y-0">
        <div className="relative h-1/6 flex-shrink-0 sm:w-2/12 md:w-3/12 lg:w-1/5">
          <div className="absolute left-0 top-1/2 h-[0.5px] w-full -translate-y-1/2 border-b-[0.5px] border-custom-border-200 sm:left-1/2 sm:top-0 sm:h-screen sm:w-[0.5px] sm:-translate-x-1/2 sm:translate-y-0 sm:border-r-[0.5px] md:left-1/3" />
          <Link
            className="absolute left-5 top-1/2 grid -translate-y-1/2 place-items-center bg-custom-background-100 px-3 sm:left-1/2 sm:top-12 sm:-translate-x-[15px] sm:translate-y-0 sm:px-0 sm:py-5 md:left-1/3"
            href="/"
          >
            <div className="h-[30px] w-[133px]">
              <Image src={logo} alt="Plane logo" />
            </div>
          </Link>
          <div className="absolute right-4 top-1/4 -translate-y-1/2 text-sm text-custom-text-100 sm:fixed sm:right-16 sm:top-12 sm:translate-y-0 sm:py-5">
            {currentUser?.email}
          </div>
        </div>
        <div className="relative flex h-full justify-center px-8 pb-8 sm:w-10/12 sm:items-center sm:justify-start sm:p-0 sm:pr-[8.33%] md:w-9/12 lg:w-4/5">
          <div className="w-full space-y-7 sm:space-y-10">
            <h4 className="text-2xl font-semibold">Create your workspace</h4>
            <div className="sm:w-3/4 md:w-2/5">
              <CreateWorkspaceForm
                onSubmit={onSubmit}
                defaultValues={defaultValues}
                setDefaultValues={setDefaultValues as any}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

CreateWorkspacePage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthenticationWrapper>
      <DefaultLayout>{page} </DefaultLayout>
    </AuthenticationWrapper>
  );
};

export default CreateWorkspacePage;
