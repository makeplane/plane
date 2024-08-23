import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
// plane types
import { TPageVersion } from "@plane/types";
// plane ui
import { Loader } from "@plane/ui";
// components
import { PlaneVersionsSidebarListItem } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";

type Props = {
  activeVersion: string | null;
  handleClose: () => void;
  versions: TPageVersion[] | undefined;
};

export const PageVersionsSidebar: React.FC<Props> = (props) => {
  const { activeVersion, handleClose, versions } = props;
  // params
  const pathname = usePathname();
  const currentSearchParams = useSearchParams();

  const getVersionLink = (versionID: string) => {
    // add query param, version=current to the route
    const updatedSearchParams = new URLSearchParams(currentSearchParams.toString());
    updatedSearchParams.set("version", versionID);
    return pathname + "?" + updatedSearchParams.toString();
  };

  return (
    <div className="flex-shrink-0 py-4 border-l border-custom-border-200 flex flex-col">
      <div className="px-6 flex items-center justify-between gap-2">
        <h5 className="text-base font-semibold">Version history</h5>
        <button
          type="button"
          onClick={handleClose}
          className="flex-shrink-0 size-6 grid place-items-center text-custom-text-300 hover:text-custom-text-100 transition-colors"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-4 px-4 h-full space-y-2 overflow-y-scroll vertical-scrollbar scrollbar-sm">
        <Link
          href={getVersionLink("current")}
          className={cn("block p-2 rounded-md w-72 hover:bg-custom-background-80 transition-colors", {
            "bg-custom-background-80": activeVersion === "current",
          })}
        >
          <p className="text-sm font-medium">Current version</p>
        </Link>
        {versions ? (
          versions.map((version) => (
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
    </div>
  );
};
