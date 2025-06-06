import { observer } from "mobx-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TPageVersion } from "@plane/types";
import { Avatar } from "@plane/ui";
import { cn, renderFormattedDate, renderFormattedTime, getFileURL } from "@plane/utils";
// helpers
// hooks
import { useMember } from "@/hooks/store";

type Props = {
  href: string;
  isActive: boolean;
  version: TPageVersion;
};

export const PlaneVersionsSidebarListItem: React.FC<Props> = observer((props) => {
  const { href, isActive, version } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const ownerDetails = getUserDetails(version.owned_by);
  // translation
  const { t } = useTranslation();

  return (
    <Link
      href={href}
      className={cn("block p-2 rounded-md w-72 hover:bg-custom-background-80 transition-colors", {
        "bg-custom-background-80": isActive,
      })}
    >
      <p className="text-sm font-medium truncate">
        {renderFormattedDate(version.last_saved_at)} {renderFormattedTime(version.last_saved_at)}
      </p>
      <p className="mt-2 flex items-center gap-1 text-xs">
        <Avatar
          src={getFileURL(ownerDetails?.avatar_url ?? "")}
          name={ownerDetails?.display_name}
          shape="square"
          size="sm"
          className="flex-shrink-0"
        />
        <span className="text-custom-text-300">{ownerDetails?.display_name ?? t("common.deactivated_user")}</span>
      </p>
    </Link>
  );
});
