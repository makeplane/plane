"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// plane constants
import { EUserPermissionsLevel } from "@plane/constants";
// plane i18n
import { useTranslation } from "@plane/i18n";
// components
import { SIDEBAR_WORKSPACE_MENU_ITEMS, sidebarUserMenuItems } from "@/components/workspace";
// hooks
import { useUser, useUserPermissions } from "@/hooks/store";
import { useAppRouter } from "@/hooks/use-app-router";
// local components
import { PowerKCommandItem } from "./command-item";

type Props = {
  handleClose: () => void;
};

export const PowerKNavigationMenu: React.FC<Props> = observer((props) => {
  const { handleClose } = props;
  // navigation
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const { allowPermissions } = useUserPermissions();
  // derived values
  const SIDEBAR_USER_MENU_ITEMS = sidebarUserMenuItems(currentUser?.id ?? "");
  // translation
  const { t } = useTranslation();

  return (
    <Command.Group heading="Navigation">
      {[...SIDEBAR_USER_MENU_ITEMS, ...SIDEBAR_WORKSPACE_MENU_ITEMS].map((item) => {
        if (!allowPermissions(item.access as any, EUserPermissionsLevel.WORKSPACE, workspaceSlug.toString())) {
          return null;
        }

        return (
          <PowerKCommandItem
            key={item.key}
            icon={item.Icon}
            label={t(item.labelTranslationKey)}
            onSelect={() => {
              router.push(`/${workspaceSlug.toString()}${item.href}`);
              handleClose();
            }}
          />
        );
      })}
    </Command.Group>
  );
});
