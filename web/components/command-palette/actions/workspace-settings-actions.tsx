import { useRouter } from "next/router";
import { Command } from "cmdk";
// icons
import { SettingIcon } from "components/icons";

type Props = {
  closePalette: () => void;
};

export const CommandPaletteWorkspaceSettingsActions: React.FC<Props> = (props) => {
  const { closePalette } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const redirect = (path: string) => {
    closePalette();
    router.push(path);
  };

  return (
    <>
      <Command.Item onSelect={() => redirect(`/${workspaceSlug}/settings`)} className="focus:outline-none">
        <div className="flex items-center gap-2 text-custom-text-200">
          <SettingIcon className="h-4 w-4 text-custom-text-200" />
          General
        </div>
      </Command.Item>
      <Command.Item onSelect={() => redirect(`/${workspaceSlug}/settings/members`)} className="focus:outline-none">
        <div className="flex items-center gap-2 text-custom-text-200">
          <SettingIcon className="h-4 w-4 text-custom-text-200" />
          Members
        </div>
      </Command.Item>
      <Command.Item onSelect={() => redirect(`/${workspaceSlug}/settings/billing`)} className="focus:outline-none">
        <div className="flex items-center gap-2 text-custom-text-200">
          <SettingIcon className="h-4 w-4 text-custom-text-200" />
          Billing and Plans
        </div>
      </Command.Item>
      <Command.Item onSelect={() => redirect(`/${workspaceSlug}/settings/integrations`)} className="focus:outline-none">
        <div className="flex items-center gap-2 text-custom-text-200">
          <SettingIcon className="h-4 w-4 text-custom-text-200" />
          Integrations
        </div>
      </Command.Item>
      <Command.Item onSelect={() => redirect(`/${workspaceSlug}/settings/imports`)} className="focus:outline-none">
        <div className="flex items-center gap-2 text-custom-text-200">
          <SettingIcon className="h-4 w-4 text-custom-text-200" />
          Import
        </div>
      </Command.Item>
      <Command.Item onSelect={() => redirect(`/${workspaceSlug}/settings/exports`)} className="focus:outline-none">
        <div className="flex items-center gap-2 text-custom-text-200">
          <SettingIcon className="h-4 w-4 text-custom-text-200" />
          Export
        </div>
      </Command.Item>
    </>
  );
};
