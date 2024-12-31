import { observer } from "mobx-react";
// hooks
import { useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants";
// local components
import { InitiativeDetailsSidebar } from "../initiative-details/sidebar";
import { InitiativeDetailSection } from "./section/root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
};

export const InitiativeDetailRoot = observer((props: Props) => {
  const { workspaceSlug, initiativeId } = props;
  // store hooks
  const { allowPermissions } = useUserPermissions();

  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <div className="flex h-full w-full overflow-hidden">
      <InitiativeDetailSection workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={!isEditable} />
      <InitiativeDetailsSidebar workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={!isEditable} />
    </div>
  );
});
