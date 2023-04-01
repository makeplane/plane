import React from "react";
// next
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
// layouts
import DefaultLayout from "layouts/default-layout";
// hooks
import useUser from "hooks/use-user";
// img
import ProjectSettingImg from "public/project-setting.svg";

type TNotAuthorizedViewProps = {
  actionButton?: React.ReactNode;
};

export const NotAuthorizedView: React.FC<TNotAuthorizedViewProps> = (props) => {
  const { actionButton } = props;

  const { user } = useUser();
  const { asPath: currentPath } = useRouter();

  return (
    <DefaultLayout
      meta={{
        title: "Plane - Not Authorized",
        description: "You are not authorized to view this page",
      }}
    >
      <div className="flex h-full w-full flex-col items-center justify-center gap-y-5 text-center">
        <div className="h-44 w-72">
          <Image src={ProjectSettingImg} height="176" width="288" alt="ProjectSettingImg" />
        </div>
        <h1 className="text-xl font-medium text-gray-900">
          Oops! You are not authorized to view this page
        </h1>

        <div className="w-full text-base text-gray-500 max-w-md ">
          {user ? (
            <p className="">
              You have signed in as {user.email}.{" "}
              <Link href={`/signin?next=${currentPath}`}>
                <a className="text-gray-900 font-medium">Sign in</a>
              </Link>{" "}
              with different account that has access to this page.
            </p>
          ) : (
            <p className="">
              You need to{" "}
              <Link href={`/signin?next=${currentPath}`}>
                <a className="text-gray-900 font-medium">Sign in</a>
              </Link>{" "}
              with an account that has access to this page.
            </p>
          )}
        </div>

        {actionButton}
      </div>
    </DefaultLayout>
  );
};
