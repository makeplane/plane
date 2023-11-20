import { FC, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { observer } from "mobx-react-lite";
// icons
import { LayoutGrid } from "lucide-react";
// ui
import { Button } from "@plane/ui";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
// images
import AccessDeniedImg from "public/auth/access-denied.svg";

export interface IAdminAuthWrapper {
  children: ReactNode;
}

export const AdminAuthWrapper: FC<IAdminAuthWrapper> = observer(({ children }) => {
  // store
  const {
    user: { isUserInstanceAdmin },
    workspace: { workspaceSlug },
    user: { currentUserSettings },
  } = useMobxStore();

  // redirect url
  const redirectWorkspaceSlug =
    workspaceSlug ||
    currentUserSettings?.workspace?.last_workspace_slug ||
    currentUserSettings?.workspace?.fallback_workspace_slug ||
    "";

  // if user does not have admin access to the instance
  if (isUserInstanceAdmin !== undefined && isUserInstanceAdmin === false) {
    return (
      <div className={`h-screen w-full flex items-center justify-center overflow-hidden`}>
        <div className="w-3/5 h-2/3 bg-custom-background-90">
          <div className="grid h-full place-items-center p-4">
            <div className="space-y-8 text-center">
              <div className="space-y-2">
                <Image src={AccessDeniedImg} height="220" width="550" alt="AccessDeniedImg" />
                <h3 className="text-3xl font-semibold">Access denied!</h3>
                <div className="mx-auto text-base text-custom-text-100">
                  <p>Sorry, but you do not have permission to view this page.</p>
                  <p>
                    If you think there{"’"}s a mistake contact <span className="font-semibold">support.</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Link href={`/${redirectWorkspaceSlug}`}>
                  <a>
                    <Button variant="primary" size="sm">
                      <LayoutGrid width={16} height={16} />
                      Back to Dashboard
                    </Button>
                  </a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
});
