"use client";

import { Command } from "cmdk";
// hooks
import Link from "next/link";
import { useParams } from "next/navigation";

// hooks
import { useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// plane wev constants
import { EUserPermissionsLevel } from "@/plane-web/constants/user-permissions";
import { WORKSPACE_SETTINGS_LINKS } from "@/plane-web/constants/workspace";
// plane web helpers
import { shouldRenderSettingLink } from "@/plane-web/helpers/workspace.helper";

type Props = {
  closePalette: () => void;
};

export const CommandPaletteWorkspaceSettingsActions: React.FC<Props> = (props) => {
  const { closePalette } = props;
  // router
  const router = useAppRouter();
  // router params
  const { workspaceSlug } = useParams();
  // mobx store
  const { allowPermissions } = useUserPermissions();
  // derived values

  const redirect = (path: string) => {
    closePalette();
    router.push(path);
  };

  return (
    <>
      {WORKSPACE_SETTINGS_LINKS.map(
        (setting) =>
          allowPermissions(setting.access, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString()) &&
          shouldRenderSettingLink(setting.key) && (
            <Command.Item
              key={setting.key}
              onSelect={() => redirect(`/${workspaceSlug}${setting.href}`)}
              className="focus:outline-none"
            >
              <Link href={`/${workspaceSlug}${setting.href}`}>
                <div className="flex items-center gap-2 text-custom-text-200">
                  <setting.Icon className="h-4 w-4 text-custom-text-200" />
                  {setting.label}
                </div>
              </Link>
            </Command.Item>
          )
      )}
    </>
  );
};
