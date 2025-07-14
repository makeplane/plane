import { observer } from "mobx-react";
import Link from "next/link";
import { useParams } from "next/navigation";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/ui";
import { calculateTimeAgoShort, getFileURL, renderFormattedDate } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";
// store
import { TPageInstance } from "@/store/pages/base-page";

type Props = {
  page: TPageInstance;
};

export const PageNavigationPaneInfoTabActorsInfo: React.FC<Props> = observer((props) => {
  const { page } = props;
  // navigation
  const { workspaceSlug } = useParams();
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const { owned_by, updated_by } = page;
  const editorInformation = updated_by ? getUserDetails(updated_by) : undefined;
  const creatorInformation = owned_by ? getUserDetails(owned_by) : undefined;
  // translation
  const { t } = useTranslation();

  return (
    <div className="space-y-3 mt-4">
      <div>
        <p className="text-xs font-medium text-custom-text-300">
          {t("page_navigation_pane.tabs.info.actors_info.edited_by")}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm font-medium">
          <Link href={`/${workspaceSlug?.toString()}/profile/${page.updated_by}`} className="flex items-center gap-1">
            <Avatar
              src={getFileURL(editorInformation?.avatar_url ?? "")}
              name={editorInformation?.display_name}
              className="flex-shrink-0"
              size="sm"
            />
            <span>{editorInformation?.display_name ?? t("common.deactivated_user")}</span>
          </Link>
          <span className="flex-shrink-0 text-custom-text-300">{calculateTimeAgoShort(page.updated_at ?? "")} ago</span>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-custom-text-300">
          {t("page_navigation_pane.tabs.info.actors_info.created_by")}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 text-sm font-medium">
          <Link href={`/${workspaceSlug?.toString()}/profile/${page.created_by}`} className="flex items-center gap-1">
            <Avatar
              src={getFileURL(creatorInformation?.avatar_url ?? "")}
              name={creatorInformation?.display_name}
              className="flex-shrink-0"
              size="sm"
            />
            <span>{creatorInformation?.display_name ?? t("common.deactivated_user")}</span>
          </Link>
          <span className="flex-shrink-0 text-custom-text-300">{renderFormattedDate(page.created_at)}</span>
        </div>
      </div>
    </div>
  );
});
