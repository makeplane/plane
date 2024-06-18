"use client";

import { Command } from "cmdk";
// hooks
import Link from "next/link";
import { useParams } from "next/navigation";
// constants
import { EUserWorkspaceRoles, WORKSPACE_SETTINGS_LINKS } from "@/constants/workspace";
// hooks
import { useUser } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";

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
  const {
    membership: { currentWorkspaceRole },
  } = useUser();
  // derived values
  const workspaceMemberInfo = currentWorkspaceRole || EUserWorkspaceRoles.GUEST;

  const redirect = (path: string) => {
    closePalette();
    router.push(path);
  };

  return (
    <>
      {WORKSPACE_SETTINGS_LINKS.map(
        (setting) =>
          workspaceMemberInfo >= setting.access && (
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
