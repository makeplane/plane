import React from "react";

import { useRouter } from "next/router";
import Image from "next/image";

// constants
import { requiredAuth } from "lib/auth";
// layouts
import DefaultLayout from "layouts/default-layout";
// images
import Logo from "public/onboarding/logo.svg";
// types
import type { NextPage, NextPageContext } from "next";
// constants
import { CreateWorkspaceForm } from "components/workspace";

const CreateWorkspace: NextPage = () => {
  const router = useRouter();

  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-5">
        <div className="w-full space-y-4">
          <div className="mb-8 text-center">
            <Image src={Logo} height="50" alt="Plane Logo" />
          </div>
          <CreateWorkspaceForm onSubmit={(res) => router.push(`/${res.slug}`)} />
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
