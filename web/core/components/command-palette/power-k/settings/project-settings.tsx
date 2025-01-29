import React from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
// hooks
import { useUserPermissions } from "@/hooks/store";
// plane web constants
import { EUserPermissionsLevel, PROJECT_SETTINGS_LINKS } from "@/plane-web/constants";

type Props = {
  handleClose: () => void;
};

export const PowerKProjectSettingsMenu: React.FC<Props> = observer((props) => {
  const { handleClose } = props;
  // navigation
  const { workspaceSlug, projectId } = useParams();
  const router = useRouter();
  // store hooks
  const { allowPermissions } = useUserPermissions();

  return (
    <>
      {PROJECT_SETTINGS_LINKS.map(
        (setting) =>
          allowPermissions(
            setting.access,
            EUserPermissionsLevel.PROJECT,
            workspaceSlug?.toString(),
            projectId?.toString()
          ) && (
            <Command.Item
              key={setting.key}
              onSelect={() => {
                handleClose();
                router.push(`/${workspaceSlug}/projects/${projectId}${setting.href}`);
              }}
              className="focus:outline-none"
            >
              <Link
                href={`/${workspaceSlug}/projects/${projectId}${setting.href}`}
                className="flex items-center gap-2 text-custom-text-200"
              >
                <setting.Icon className="flex-shrink-0 size-4 text-custom-text-200" />
                {setting.label}
              </Link>
            </Command.Item>
          )
      )}
    </>
  );
});
