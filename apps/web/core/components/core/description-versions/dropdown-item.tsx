import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TDescriptionVersion } from "@plane/types";
import { Avatar, CustomMenu } from "@plane/ui";
import { calculateTimeAgo, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";

type Props = {
  onClick: (versionId: string) => void;
  version: TDescriptionVersion;
};

export const DescriptionVersionsDropdownItem = observer(function DescriptionVersionsDropdownItem(props: Props) {
  const { onClick, version } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const versionCreator = version.owned_by ? getUserDetails(version.owned_by) : null;
  // translation
  const { t } = useTranslation();

  return (
    <CustomMenu.MenuItem key={version.id} className="flex items-center gap-1" onClick={() => onClick(version.id)}>
      <span className="flex-shrink-0">
        <Avatar
          name={versionCreator?.display_name ?? t("common.deactivated_user")}
          size="sm"
          src={getFileURL(versionCreator?.avatar_url ?? "")}
        />
      </span>
      <p className="text-11 text-secondary flex items-center gap-1.5">
        <span className="font-medium">{versionCreator?.display_name ?? t("common.deactivated_user")}</span>
        <span>{calculateTimeAgo(version.last_saved_at)}</span>
      </p>
    </CustomMenu.MenuItem>
  );
});
