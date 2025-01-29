import React from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// constants
import { PROFILE_ACTION_LINKS } from "@/constants/profile";

type Props = {
  handleClose: () => void;
};

export const PowerKProfileSettingsMenu: React.FC<Props> = observer((props) => {
  const { handleClose } = props;
  // navigation
  const router = useRouter();

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
            <setting.Icon className="flex-shrink-0 size-4 text-custom-text-200" />
            {setting.label}
          </Link>
        </Command.Item>
      ))}
    </>
  );
});
