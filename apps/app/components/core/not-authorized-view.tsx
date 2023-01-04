import React from "react";
// next
import Link from "next/link";
import { useRouter } from "next/router";
// layouts
import DefaultLayout from "layouts/DefaultLayout";
// hooks
import useUser from "lib/hooks/useUser";

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
      <div className="flex h-full w-full items-center justify-center">
        <div className="m-auto space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            You are not authorized to view this page
          </h1>
          <div className="space-x-3">
            {actionButton}
            <Link href={`/signin?next=${currentPath}`}>
              <a>Sign in with an account with access</a>
            </Link>
          </div>
          {user && (
            <div>
              <p className="text-sm text-gray-500">
                You are currently signed in as <span className="font-bold">{user.email}</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </DefaultLayout>
  );
};
