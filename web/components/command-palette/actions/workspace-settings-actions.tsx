import { useRouter } from "next/router";
import { Command } from "cmdk";
// icons
import { SettingIcon } from "components/icons";
import Link from "next/link";

type Props = {
  closePalette: () => void;
};

export const CommandPaletteWorkspaceSettingsActions: React.FC<Props> = (props) => {
  const { closePalette } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  return (
    <>
      <Command.Item onSelect={closePalette} className="focus:outline-none">
        <Link href={`/${workspaceSlug}/settings`}>
          <div className="flex items-center gap-2 text-custom-text-200">
            <SettingIcon className="h-4 w-4 text-custom-text-200" />
            General
          </div>
        </Link>
      </Command.Item>
      <Command.Item onSelect={closePalette} className="focus:outline-none">
        <Link href={`/${workspaceSlug}/settings/members`}>
          <div className="flex items-center gap-2 text-custom-text-200">
            <SettingIcon className="h-4 w-4 text-custom-text-200" />
            Members
          </div>
        </Link>
      </Command.Item>
      <Command.Item onSelect={closePalette} className="focus:outline-none">
        <Link href={`/${workspaceSlug}/settings/billing`}>
          <div className="flex items-center gap-2 text-custom-text-200">
            <SettingIcon className="h-4 w-4 text-custom-text-200" />
            Billing and Plans
          </div>
        </Link>
      </Command.Item>
      <Command.Item onSelect={closePalette} className="focus:outline-none">
        <Link href={`/${workspaceSlug}/settings/integrations`}>
          <div className="flex items-center gap-2 text-custom-text-200">
            <SettingIcon className="h-4 w-4 text-custom-text-200" />
            Integrations
          </div>
        </Link>
      </Command.Item>
      <Command.Item onSelect={closePalette} className="focus:outline-none">
        <Link href={`/${workspaceSlug}/settings/imports`}>
          <div className="flex items-center gap-2 text-custom-text-200">
            <SettingIcon className="h-4 w-4 text-custom-text-200" />
            Import
          </div>
        </Link>
      </Command.Item>
      <Command.Item onSelect={closePalette} className="focus:outline-none">
        <Link href={`/${workspaceSlug}/settings/exports`}>
          <div className="flex items-center gap-2 text-custom-text-200">
            <SettingIcon className="h-4 w-4 text-custom-text-200" />
            Export
          </div>
        </Link>
      </Command.Item>
    </>
  );
};
