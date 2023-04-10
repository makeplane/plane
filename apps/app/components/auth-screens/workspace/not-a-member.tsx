import Link from "next/link";
import { useRouter } from "next/router";

// layouts
import DefaultLayout from "layouts/default-layout";
// ui
import { PrimaryButton, SecondaryButton } from "components/ui";

export const NotAWorkspaceMember = () => {
  const router = useRouter();

  return (
    <DefaultLayout
      meta={{
        title: "Plane - Unauthorized User",
        description: "Unauthorized user",
      }}
    >
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Not Authorized!</h3>
            <p className="text-sm text-gray-500 w-1/2 mx-auto">
              You{"'"}re not a member of this workspace. Please contact the workspace admin to get
              an invitation or check your pending invitations.
            </p>
          </div>
          <div className="flex items-center gap-2 justify-center">
            <Link href="/invitations">
              <a>
                <SecondaryButton onClick={() => router.back()}>
                  Check pending invites
                </SecondaryButton>
              </a>
            </Link>
            <Link href="/create-workspace">
              <a>
                <PrimaryButton>Create new workspace</PrimaryButton>
              </a>
            </Link>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};
