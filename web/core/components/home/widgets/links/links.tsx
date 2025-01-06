import { FC, useEffect, useState } from "react";
import { observer } from "mobx-react";
// computed
import { useHome } from "@/hooks/store/use-home";
import { EWidgetKeys, WidgetLoader } from "../loaders";
import { AddLink } from "./action";
import { ProjectLinkDetail } from "./link-detail";
import { TLinkOperations } from "./use-links";

export type TLinkOperationsModal = Exclude<TLinkOperations, "create">;

export type TProjectLinkList = {
  linkOperations: TLinkOperationsModal;
  workspaceSlug: string;
};

export const ProjectLinkList: FC<TProjectLinkList> = observer((props) => {
  // props
  const { linkOperations, workspaceSlug } = props;
  // states
  const [columnCount, setColumnCount] = useState(4);
  const [showAll, setShowAll] = useState(false);
  // hooks
  const {
    quickLinks: { getLinksByWorkspaceId, toggleLinkModal },
  } = useHome();

  const links = getLinksByWorkspaceId(workspaceSlug);

  useEffect(() => {
    const updateColumnCount = () => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        setColumnCount(4); // lg screens
      } else if (window.matchMedia("(min-width: 768px)").matches) {
        setColumnCount(3); // md screens
      } else if (window.matchMedia("(min-width: 640px)").matches) {
        setColumnCount(2); // sm screens
      } else {
        setColumnCount(1); // mobile
      }
    };

    // Initial check
    updateColumnCount();

    // Add event listener for window resize
    window.addEventListener("resize", updateColumnCount);

    // Cleanup
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  if (links === undefined) return <WidgetLoader widgetKey={EWidgetKeys.QUICK_LINKS} />;

  return (
    <div>
      <div className="flex gap-2 mb-2 flex-wrap justify-center ">
        {links &&
          links.length > 0 &&
          (showAll ? links : links.slice(0, 2 * columnCount - 1)).map((linkId) => (
            <ProjectLinkDetail key={linkId} linkId={linkId} linkOperations={linkOperations} />
          ))}

        {/* Add new link */}
        <AddLink onClick={() => toggleLinkModal(true)} />
      </div>
      {links.length > 2 * columnCount - 1 && (
        <button
          className="flex items-center justify-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-custom-primary-100 mx-auto"
          onClick={() => setShowAll((state) => !state)}
        >
          {showAll ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
});
