import { FC } from "react";
import { observer } from "mobx-react";
// computed
import { ContentOverflowWrapper } from "@/components/core/content-overflow-HOC";
import { useHome } from "@/hooks/store/use-home";
import { EWidgetKeys, WidgetLoader } from "../loaders";
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
  // hooks
  const {
    quickLinks: { getLinksByWorkspaceId },
  } = useHome();

  const links = getLinksByWorkspaceId(workspaceSlug);

  if (links === undefined) return <WidgetLoader widgetKey={EWidgetKeys.QUICK_LINKS} />;

  return (
    <ContentOverflowWrapper
      maxHeight={150}
      containerClassName="pb-2 box-border"
      fallback={<></>}
      buttonClassName="bg-custom-background-90/20"
    >
      <div>
        <div className="flex gap-2 mb-2 flex-wrap">
          {links &&
            links.length > 0 &&
            links.map((linkId) => <ProjectLinkDetail key={linkId} linkId={linkId} linkOperations={linkOperations} />)}
        </div>
      </div>
    </ContentOverflowWrapper>
  );
});
