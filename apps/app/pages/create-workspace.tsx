import React from "react";

import { useRouter } from "next/router";
import Image from "next/image";

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

  return (
    <UserAuthorizationLayout>
      <DefaultLayout>
        <div className="grid h-full place-items-center p-5">
          <div className="w-full space-y-4">
            <div className="mb-8 text-center">
              <Image src={Logo} height="50" alt="Plane Logo" />
            </div>
            <CreateWorkspaceForm
              defaultValues={defaultValues}
              setDefaultValues={() => {}}
              onSubmit={(res) => router.push(`/${res.slug}`)}
            />
          </div>
        </div>
      </DefaultLayout>
    </UserAuthorizationLayout>
  );
};

export default CreateWorkspace;
