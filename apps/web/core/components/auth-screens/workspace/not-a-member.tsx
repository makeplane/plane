import Link from "next/link";
// ui
import { Button } from "@plane/propel/button";
// layouts
import DefaultLayout from "@/layouts/default-layout";

export function NotAWorkspaceMember() {
  return (
    <DefaultLayout>
      <div className="grid h-full place-items-center p-4">
        <div className="space-y-8 text-center">
          <div className="space-y-2">
            <h3 className="text-16 font-semibold">Not Authorized!</h3>
            <p className="mx-auto w-1/2 text-13 text-secondary">
              You{"'"}re not a member of this workspace. Please contact the workspace admin to get an invitation or
              check your pending invitations.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Link href="/invitations">
              <span>
                <Button variant="secondary">Check pending invites</Button>
              </span>
            </Link>
            <Link href="/create-workspace">
              <span>
                <Button variant="primary">Create new workspace</Button>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
}
