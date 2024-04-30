import { FC, ReactNode } from "react";
import { observer } from "mobx-react";
// hooks
import { useAppRouter } from "@/hooks/store";
// components

export interface IAdminAuthWrapper {
  children: ReactNode;
}

export const AdminAuthWrapper: FC<IAdminAuthWrapper> = observer(({ children }) => {
  // store hooks
  const { workspaceSlug } = useAppRouter();
  // FIXME:
  // const { isUserInstanceAdmin, currentUserSettings } = useUser();
  // redirect url
  const redirectWorkspaceSlug =
    workspaceSlug ||
    // currentUserSettings?.workspace?.last_workspace_slug ||
    // currentUserSettings?.workspace?.fallback_workspace_slug ||
    "";

  console.log("redirectWorkspaceSlug", redirectWorkspaceSlug);

  // if user does not have admin access to the instance
  // if (isUserInstanceAdmin !== undefined && isUserInstanceAdmin === false) {
  //   return <InstanceAdminRestriction redirectWorkspaceSlug={redirectWorkspaceSlug} />;
  // }

  return <>{children}</>;
});
