import { observer } from "mobx-react";
// hooks
import { useUserPermissions } from "@/hooks/store";
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
// local components
import { LayoutRoot } from "../../common";
import { InitiativeEmptyState } from "../details/empty-state";
import { InitiativeMainContentRoot } from "./main/root";
import { InitiativeSidebarRoot } from "./sidebar/root";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
};

export const InitiativeDetailRoot = observer((props: Props) => {
  const { workspaceSlug, initiativeId } = props;
  // store hooks
  const {
    initiative: { getInitiativeById },
  } = useInitiatives();
  const { allowPermissions } = useUserPermissions();

  // derived values
  const initiative = getInitiativeById(initiativeId);

  const isEditable = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  return (
    <LayoutRoot
      renderEmptyState={!initiative}
      emptyStateComponent={<InitiativeEmptyState workspaceSlug={workspaceSlug} />}
    >
      <InitiativeMainContentRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={!isEditable} />
      <InitiativeSidebarRoot workspaceSlug={workspaceSlug} initiativeId={initiativeId} disabled={!isEditable} />
    </LayoutRoot>
  );
});
