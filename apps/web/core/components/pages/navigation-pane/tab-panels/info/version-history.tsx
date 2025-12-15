import { useCallback } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TPageVersion } from "@plane/types";
import { Avatar } from "@plane/ui";
import { cn, getFileURL, renderFormattedDate, renderFormattedTime } from "@plane/utils";
// components
import type { TPageRootHandlers } from "@/components/pages/editor/page-root";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useQueryParams } from "@/hooks/use-query-params";
// store
import type { TPageInstance } from "@/store/pages/base-page";
// local imports
import { PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM } from "../..";

type Props = {
  page: TPageInstance;
  versionHistory: Pick<TPageRootHandlers, "fetchAllVersions" | "fetchVersionDetails">;
};

type VersionHistoryItemProps = {
  getVersionLink: (versionID: string) => string;
  isVersionActive: boolean;
  version: TPageVersion;
};

const VersionHistoryItem = observer(function VersionHistoryItem(props: VersionHistoryItemProps) {
  const { getVersionLink, isVersionActive, version } = props;
  // store hooks
  const { getUserDetails } = useMember();
  // derived values
  const versionCreator = getUserDetails(version.owned_by);
  // translation
  const { t } = useTranslation();

  return (
    <li className="relative flex items-center gap-x-4 text-11 font-medium">
      {/* timeline icon */}
      <div className="relative size-6 flex-none grid place-items-center">
        <div className="size-2 rounded-full bg-layer-3" />
      </div>
      {/* end timeline icon */}
      <Link
        href={getVersionLink(version.id)}
        className={cn("block flex-1 hover:bg-layer-transparent-hover rounded-md py-2 px-1", {
          " bg-layer-transparent-selected hover:bg-layer-transparent-selected": isVersionActive,
        })}
      >
        <p className="text-tertiary">
          {renderFormattedDate(version.last_saved_at)}, {renderFormattedTime(version.last_saved_at)}
        </p>
        <p className="mt-1 flex items-center gap-1">
          <Avatar
            size="sm"
            src={getFileURL(versionCreator?.avatar_url ?? "")}
            name={versionCreator?.display_name}
            className="shrink-0"
          />
          <span>{versionCreator?.display_name ?? t("common.deactivated_user")}</span>
        </p>
      </Link>
    </li>
  );
});

export const PageNavigationPaneInfoTabVersionHistory = observer(function PageNavigationPaneInfoTabVersionHistory(
  props: Props
) {
  const { page, versionHistory } = props;
  // navigation
  const searchParams = useSearchParams();
  const activeVersion = searchParams.get(PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM);
  // derived values
  const { id } = page;
  // translation
  const { t } = useTranslation();
  // query params
  const { updateQueryParams } = useQueryParams();
  // fetch all versions
  const { data: versionsList } = useSWR(
    id ? `PAGE_VERSIONS_LIST_${id}` : null,
    id ? () => versionHistory.fetchAllVersions(id) : null
  );

  const getVersionLink = useCallback(
    (versionID?: string) => {
      if (versionID) {
        return updateQueryParams({
          paramsToAdd: { [PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM]: versionID },
        });
      } else {
        return updateQueryParams({
          paramsToRemove: [PAGE_NAVIGATION_PANE_VERSION_QUERY_PARAM],
        });
      }
    },
    [updateQueryParams]
  );

  return (
    <div>
      <p className="text-11 font-medium text-secondary">{t("page_navigation_pane.tabs.info.version_history.label")}</p>
      <div className="mt-3">
        <ul className="relative">
          {/* timeline line */}
          <div className={cn("absolute left-0 top-0 h-full flex w-6 justify-center")}>
            <div className="w-px bg-layer-3" />
          </div>
          {/* end timeline line */}
          <li className="relative flex items-center gap-x-4 text-11 font-medium">
            {/* timeline icon */}
            <div className="relative size-6 flex-none rounded-full grid place-items-center bg-accent-primary/20">
              <div className="size-2.5 rounded-full bg-accent-primary/40" />
            </div>
            {/* end timeline icon */}
            <Link
              href={getVersionLink()}
              className={cn("flex-1 bg-layer-transparent hover:bg-layer-transparent-hover rounded-md py-2 px-1", {
                "bg-layer-transparent-selected hover:bg-layer-transparent-selected": !activeVersion,
              })}
            >
              {t("page_navigation_pane.tabs.info.version_history.current_version")}
            </Link>
          </li>
          {versionsList?.map((version) => (
            <VersionHistoryItem
              key={version.id}
              getVersionLink={getVersionLink}
              isVersionActive={activeVersion === version.id}
              version={version}
            />
          ))}
        </ul>
      </div>
    </div>
  );
});
