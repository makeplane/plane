import { useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FileText } from "lucide-react";
// components
import { Logo } from "@/components/common";
// helpers
import { getPageName } from "@/helpers/page.helper";
// plane web components
import { WorkspacePageQuickActions } from "@/plane-web/components/pages";
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
    <div className="group/list-item rounded-md flex items-center gap-1.5 hover:bg-custom-background-90 py-1.5 px-1">
      <Link href={`/${workspaceSlug.toString()}/pages/${pageId}`} className="flex-grow" ref={parentRef}>
        <div className="flex items-center gap-1.5">
          <span className="size-4 flex-shrink-0 grid place-items-center">
            {page.logo_props?.in_use ? (
              <Logo logo={page.logo_props} size={14} type="lucide" />
            ) : (
              <FileText className="size-3.5 text-custom-text-300" />
            )}
          </span>
          <p className="text-custom-text-200 text-sm">{getPageName(page.name)}</p>
        </div>
      </Link>
      {/* quick actions dropdown */}
      <div className="opacity-0 pointer-events-none group-hover/list-item:opacity-100 group-hover/list-item:pointer-events-auto">
        <WorkspacePageQuickActions parentRef={parentRef} page={page} pageLink={`${workspaceSlug}/pages/${page.id}`} />
      </div>
    </div>
  );
};
