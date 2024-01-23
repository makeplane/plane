import { FC, ReactNode } from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useApplication, useUser } from "hooks/store";
// components
import { InstanceAdminRestriction } from "components/instance";

export interface IAdminAuthWrapper {
  children: ReactNode;
}

export const AdminAuthWrapper: FC<IAdminAuthWrapper> = observer(({ children }) => {
  // store hooks
  const {
    router: { workspaceSlug },
  } = useApplication();
  const { isUserInstanceAdmin, currentUserSettings } = useUser();
  // redirect url
  const redirectWorkspaceSlug =
    workspaceSlug ||
    currentUserSettings?.workspace?.last_workspace_slug ||
    currentUserSettings?.workspace?.fallback_workspace_slug ||
    "";

  // if user does not have admin access to the instance
  if (isUserInstanceAdmin !== undefined && isUserInstanceAdmin === false) {
    return <InstanceAdminRestriction redirectWorkspaceSlug={redirectWorkspaceSlug} />;
  }

  return <>{children}</>;
});
