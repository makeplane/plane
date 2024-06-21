import { useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
// components
import { Logo } from "@/components/common";
import { PageQuickActions } from "@/components/pages";
// plane web hooks
import { useWorkspacePageDetails } from "@/plane-web/hooks/store";

type Props = {
  pageId: string;
};

export const PagesAppDashboardListItem: React.FC<Props> = (props) => {
  const { pageId } = props;
  // params
  const { workspaceSlug } = useParams();
  // refs
  const parentRef = useRef(null);
  // store hooks
  const page = useWorkspacePageDetails(pageId);

  return (
    <Link
      href={`/${workspaceSlug.toString()}/pages/${pageId}`}
      className="group/list-item flex items-center justify-between gap-1.5 hover:bg-custom-background-90 py-1.5 px-1 rounded-md"
      ref={parentRef}
    >
      <div className="flex items-center gap-1.5">
        <span className="size-4 flex-shrink-0 grid place-items-center">
          {page.logo_props?.in_use ? (
            <Logo logo={page.logo_props} size={14} type="lucide" />
          ) : (
            <FileText className="size-3.5 text-custom-text-300" />
          )}
        </span>
        <p className="text-custom-text-200 text-sm">{page.name}</p>
      </div>
      {/* quick actions dropdown */}
      <div
        className="opacity-0 pointer-events-none group-hover/list-item:opacity-100 group-hover/list-item:pointer-events-auto"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <PageQuickActions parentRef={parentRef} page={page} pageLink={`/${workspaceSlug}/pages`} />
      </div>
    </Link>
  );
};
