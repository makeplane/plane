import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { TriangleAlert } from "lucide-react";
// plane types
import { TPageVersion } from "@plane/types";
// plane ui
import { Button, Loader } from "@plane/ui";
// components
import { PlaneVersionsSidebarListItem } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useQueryParams } from "@/hooks/use-query-params";

type Props = {
  activeVersion: string | null;
  fetchAllVersions: (pageId: string) => Promise<TPageVersion[] | undefined>;
  isOpen: boolean;
  pageId: string;
};

export const PageVersionsSidebarList: React.FC<Props> = (props) => {
  const { activeVersion, fetchAllVersions, isOpen, pageId } = props;
  // states
  const [isRetrying, setIsRetrying] = useState(false);
  // update query params
  const { updateQueryParams } = useQueryParams();

  const {
    data: versionsList,
    error: versionsListError,
    mutate: mutateVersionsList,
  } = useSWR(
    pageId && isOpen ? `PAGE_VERSIONS_LIST_${pageId}` : null,
    pageId && isOpen ? () => fetchAllVersions(pageId) : null
  );

  const handleRetry = async () => {
    setIsRetrying(true);
    await mutateVersionsList();
    setIsRetrying(false);
  };

  const getVersionLink = (versionID: string) =>
    updateQueryParams({
      paramsToAdd: { version: versionID },
    });

  return (
    <div className="mt-4 px-4 h-full flex flex-col space-y-2 overflow-y-scroll vertical-scrollbar scrollbar-sm">
      <Link
        href={getVersionLink("current")}
        className={cn("block p-2 rounded-md w-72 hover:bg-custom-background-80 transition-colors", {
          "bg-custom-background-80": activeVersion === "current",
        })}
      >
        <p className="text-sm font-medium">Current version</p>
      </Link>
      {versionsListError ? (
        <div className="h-full grid place-items-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex-shrink-0 grid place-items-center size-11 text-custom-text-300">
              <TriangleAlert className="size-10" />
            </span>
            <div>
              <h6 className="text-base font-semibold">Something went wrong!</h6>
              <p className="text-xs text-custom-text-300">
                There was a problem while loading previous
                <br />
                versions, please try again.
              </p>
            </div>
            <Button variant="link-primary" onClick={handleRetry} loading={isRetrying}>
              Try again
            </Button>
          </div>
        </div>
      ) : versionsList ? (
        versionsList.map((version) => (
          <PlaneVersionsSidebarListItem
            key={version.id}
            href={getVersionLink(version.id)}
            isActive={activeVersion === version.id}
            version={version}
          />
        ))
      ) : (
        <Loader className="space-y-4">
          <Loader.Item height="56px" />
          <Loader.Item height="56px" />
          <Loader.Item height="56px" />
          <Loader.Item height="56px" />
          <Loader.Item height="56px" />
        </Loader>
      )}
    </div>
  );
};
