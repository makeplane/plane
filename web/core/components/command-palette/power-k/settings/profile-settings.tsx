import React from "react";
import { ProjectActionIcons } from "app/profile/sidebar";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// plane imports
import { PROFILE_ACTION_LINKS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";

type Props = {
  handleClose: () => void;
};

export const PowerKProfileSettingsMenu: React.FC<Props> = observer((props) => {
  const { handleClose } = props;
  // navigation
  const router = useRouter();
  // translation
  const { t } = useTranslation();

  return (
    <>
      {PROFILE_ACTION_LINKS.map((setting) => (
        <Command.Item
          key={setting.key}
          onSelect={() => {
            handleClose();
            router.push(`/profile${setting.href}`);
          }}
          className="focus:outline-none"
        >
          <Link href={`/profile${setting.href}`} className="flex items-center gap-2 text-custom-text-200">
            <ProjectActionIcons type={setting.key} size={16} />
            {t(setting.i18n_label)}
          </Link>
        </Command.Item>
      ))}
    </>
  );
});
