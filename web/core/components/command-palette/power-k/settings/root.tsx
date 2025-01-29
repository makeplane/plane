import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Settings } from "lucide-react";
// plane types
import { TPowerKPageKeys } from "@plane/types";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissions, EUserPermissionsLevel } from "@/plane-web/constants";
// local components
import { PowerKCommandItem } from "../command-item";
import { PowerKProfileSettingsMenu } from "./profile-settings";
import { PowerKProjectSettingsMenu } from "./project-settings";
import { PowerKWorkspaceSettingsMenu } from "./workspace-settings";

type Props = {
  activePage: TPowerKPageKeys | undefined;
  handleClose: () => void;
  handleUpdateSearchTerm: (value: string) => void;
  handleUpdatePage: (page: TPowerKPageKeys) => void;
};

export const PowerKSettingsMenu: React.FC<Props> = observer((props) => {
  const { activePage, handleClose, handleUpdateSearchTerm, handleUpdatePage } = props;
  // navigation
  const { projectId } = useParams();
  // store hooks
  const { allowPermissions } = useUserPermissions();
  // derived values
  const canAccessWorkspaceSettings = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);
  const canAccessProjectSettings = !!projectId;

  return (
    <>
      {!activePage && (
        <Command.Group heading="Configs">
          {canAccessWorkspaceSettings && (
            <PowerKCommandItem
              icon={Settings}
              label="Workspace settings"
              onSelect={() => {
                handleUpdateSearchTerm("");
                handleUpdatePage("workspace-settings");
              }}
            />
          )}
          {canAccessProjectSettings && (
            <PowerKCommandItem
              icon={Settings}
              label="Project settings"
              onSelect={() => {
                handleUpdateSearchTerm("");
                handleUpdatePage("project-settings");
              }}
            />
          )}
          <PowerKCommandItem
            icon={Settings}
            label="Profile settings"
            onSelect={() => {
              handleUpdateSearchTerm("");
              handleUpdatePage("profile-settings");
            }}
          />
        </Command.Group>
      )}
      {/* workspace settings menu */}
      {activePage === "workspace-settings" && canAccessWorkspaceSettings && (
        <PowerKWorkspaceSettingsMenu handleClose={handleClose} />
      )}
      {/* project settings menu */}
      {activePage === "project-settings" && canAccessProjectSettings && (
        <PowerKProjectSettingsMenu handleClose={handleClose} />
      )}
      {/* profile settings menu */}
      {activePage === "profile-settings" && <PowerKProfileSettingsMenu handleClose={handleClose} />}
    </>
  );
});
