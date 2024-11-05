import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane
import { Button, ControlLink, EModalPosition, EModalWidth, ModalCore, setToast, TOAST_TYPE, Tooltip } from "@plane/ui";
import { TIssue } from "@plane/types";
// helpers
import { renderFormattedDate } from "@/helpers/date-time.helper";
// hooks
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { useIssueDetail } from "@/hooks/store";
// Plane-web
import { EDependencyPosition } from "@/plane-web/constants";
import { getRelationType } from "@/plane-web/store/timeline/utils";
import { Relation } from "@/plane-web/types";
//
import { IssueIdentifier } from "../../issues/issue-details";
import { useTimeLineRelationOptions } from "../../relations";

type IssueBlockProps = {
  blockId: string;
  dependencyPosition: EDependencyPosition;
  handleClose: () => void;
};

const IssueBlock = observer((props: IssueBlockProps) => {
  const { blockId, dependencyPosition, handleClose } = props;
  // hooks
  const { workspaceSlug } = useParams();
  const { isMobile } = usePlatformOS();
  const { getBlockById } = useTimeLineChartStore();

  const issueBlock = getBlockById(blockId);

  if (!issueBlock || !issueBlock.data) return <></>;

  const issueData = issueBlock.data as TIssue;
  const { handleRedirection } = useIssuePeekOverviewRedirection();

  const handleIssuePeekOverview = () => {
    handleClose();
    handleRedirection(workspaceSlug.toString(), issueData, isMobile);
  };

  let relatedDate, relatedDateTitle;
  if (dependencyPosition === EDependencyPosition.START) {
    relatedDate = renderFormattedDate(issueBlock.start_date);
    relatedDateTitle = "Start Date";
  } else if (dependencyPosition === EDependencyPosition.END) {
    relatedDate = renderFormattedDate(issueBlock.target_date);
    relatedDateTitle = "End Date";
  }

  return (
    <ControlLink
      id={`issue-${blockId}`}
      href={`/${workspaceSlug}/projects/${issueData?.project_id}/issues/${issueData?.id}`}
      onClick={handleIssuePeekOverview}
      className="relative flex flex-col gap-2 m-2 p-1 px-2 w-auto cursor-pointer  rounded text-custom-text-100 border-[0.5px] border-custom-border-800 bg-custom-background-100 hover:bg-custom-background-90"
    >
      <div className="h-12 w-full cursor-pointer items-center ">
        {issueData?.project_id && (
          <IssueIdentifier
            size="xs"
            issueId={blockId}
            projectId={issueData.project_id}
            textContainerClassName="text-2xs text-custom-text-300 font-normal"
          />
        )}
        <Tooltip tooltipContent={issueData?.name} isMobile={isMobile}>
          <span className="line-clamp-1 truncate text-sm font-medium">{issueData?.name}</span>
        </Tooltip>
        {relatedDateTitle && relatedDate && (
          <div className="text-2xs font-medium text-custom-text-400">
            {relatedDateTitle}: {relatedDate}
          </div>
        )}
      </div>
    </ControlLink>
  );
});

type DependencyPathProps = {
  relation: Relation | undefined;
  handleClose: () => void;
};

export const DependencyPathModal = observer((props: DependencyPathProps) => {
  const { relation, handleClose } = props;

  const { workspaceSlug, projectId } = useParams();
  const [isRemoving, setIsRemoving] = useState(false);

  const relationType = relation
    ? getRelationType(relation.originDependencyPosition, relation.destinationDependencyPosition)
    : undefined;
  const ISSUE_RELATION_OPTIONS = useTimeLineRelationOptions();
  const relationObject = relationType ? ISSUE_RELATION_OPTIONS[relationType] : undefined;

  const {
    relation: { removeRelation },
  } = useIssueDetail();

  const handleRemoveRelation = async () => {
    try {
      if (!relation || !relationType) return;

      setIsRemoving(true);

      await removeRelation(
        workspaceSlug.toString(),
        projectId.toString(),
        relation?.originBlock,
        relationType,
        relation?.destinationBlock
      );
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Relation Removed",
        message: "The timeline relation was successfully removed",
      });

      handleClose();
    } catch (e) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Error while removing relation.",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <ModalCore
      isOpen={!!relation}
      handleClose={() => handleClose()}
      position={EModalPosition.CENTER}
      width={EModalWidth.MD}
    >
      {relation && (
        <>
          <div className="relative flex flex-col gap-2">
            <div className="h-6 text-lg flex px-2 mt-2 items-center font-medium">
              <span>Timeline Relation</span>
            </div>
            <IssueBlock
              blockId={relation.originBlock}
              dependencyPosition={relation.originDependencyPosition}
              handleClose={handleClose}
            />

            <div className={`flex items-center gap-1 py-1 mx-2 px-2 h-9 rounded w-auto ${relationObject?.className}`}>
              <span>{relationObject?.icon ? relationObject.icon(14) : null}</span>
              <span className="text-sm font-medium leading-5">{relationObject?.label}</span>
            </div>

            <IssueBlock
              blockId={relation.destinationBlock}
              dependencyPosition={relation.destinationDependencyPosition}
              handleClose={handleClose}
            />
            <Button
              className="w-auto h-8 m-2 rounded"
              variant="accent-danger"
              loading={isRemoving}
              onClick={handleRemoveRelation}
            >
              Remove relation
            </Button>
          </div>
        </>
      )}
    </ModalCore>
  );
});
