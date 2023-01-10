import React from "react";
// next
import Link from "next/link";
import { useRouter } from "next/router";
// layouts
import DefaultLayout from "layouts/default-layout";
// hooks
import useUser from "lib/hooks/useUser";
// icons
import { LockIcon } from "ui/icons";

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
        <LockIcon className="h-16 w-16 text-gray-400" />
        <h1 className="text-xl font-medium text-gray-900">
          Oops! You are not authorized to view this page
        </h1>

        <div className="w-full md:w-1/3">
          {user ? (
            <p className="text-base font-light">
              You have signed in as <span className="font-medium">{user.email}</span>.{" "}
              <Link href={`/signin?next=${currentPath}`}>
                <a className="font-medium">Sign in</a>
              </Link>{" "}
              with different account that has access to this page.
            </p>
          ) : (
            <p className="text-base font-light">
              You need to{" "}
              <Link href={`/signin?next=${currentPath}`}>
                <a className="font-medium">Sign in</a>
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
