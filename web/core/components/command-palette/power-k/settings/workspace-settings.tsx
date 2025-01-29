import React from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissionsLevel, WORKSPACE_SETTINGS_LINKS } from "@/plane-web/constants";
// plane web helpers
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";

type Props = {
  handleClose: () => void;
};

export const PowerKWorkspaceSettingsMenu: React.FC<Props> = observer((props) => {
  const { handleClose } = props;
  // navigation
  const { workspaceSlug } = useParams();
  const router = useRouter();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  return (
    <>
      {WORKSPACE_SETTINGS_LINKS.map(
        (setting) =>
          allowPermissions(setting.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString()) &&
          shouldRenderSettingLink(setting.key) && (
            <Command.Item
              key={setting.key}
              onSelect={() => {
                handleClose();
                router.push(`/${workspaceSlug}${setting.href}`);
              }}
              className="focus:outline-none"
            >
              <Link href={`/${workspaceSlug}${setting.href}`} className="flex items-center gap-2 text-custom-text-200">
                <setting.Icon className="flex-shrink-0 size-4 text-custom-text-200" />
                {setting.label}
              </Link>
            </Command.Item>
          )
      )}
    </>
  );
});
