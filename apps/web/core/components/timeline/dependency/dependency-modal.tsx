/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Trash2Icon } from "lucide-react";
// Plane
import { useTranslation } from "@plane/i18n";
import { DueDatePropertyIcon, StartDatePropertyIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssue } from "@plane/types";
import { ControlLink, EModalPosition, EModalWidth, ModalCore, Spinner } from "@plane/ui";
// components
import { DateDropdown } from "@/components/dropdowns/date";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import useIssuePeekOverviewRedirection from "@/hooks/use-issue-peek-overview-redirection";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
// Plane-web
import type { EDependencyPosition } from "@/constants/timeline";
import { getRelationType } from "@/plane-web/store/timeline/utils";
import type { Relation } from "@/types";
// local imports
import { DependencyLineSVG } from "./dependency-line-svg";
import { IssueIdentifier } from "@/components/issues/issue-detail/issue-identifier";
import { useTimeLineRelationOptions } from "@/components/relations";

type IssueBlockProps = {
  blockId: string;
  dependencyPosition: EDependencyPosition;
  className?: string;
  handleClose: () => void;
  isEpic?: boolean;
};

const IssueBlock = observer(function IssueBlock(props: IssueBlockProps) {
  const { blockId, handleClose, className = "", isEpic = false } = props;
  // hooks
  const { workspaceSlug } = useParams();
  const { isMobile } = usePlatformOS();
  const { getBlockById } = useTimeLineChartStore();

  const issueBlock = getBlockById(blockId);

  if (!issueBlock || !issueBlock.data) return <></>;

  const issueData = issueBlock.data as TIssue;
  const { handleRedirection } = useIssuePeekOverviewRedirection(isEpic);

  const handleIssuePeekOverview = () => {
    handleClose();
    handleRedirection(workspaceSlug.toString(), issueData, isMobile);
  };

  return (
    <ControlLink
      id={`issue-${blockId}`}
      href={`/${workspaceSlug}/projects/${issueData?.project_id}/${isEpic ? "epics" : "issues"}/${issueData?.id}`}
      onClick={handleIssuePeekOverview}
      className={`relative flex justify-between gap-3 mx-2 p-2 w-auto cursor-pointer overflow-hidden rounded-sm text-primary border-[1px] bg-surface-1 hover:bg-layer-1 ${className}`}
    >
      <div className="h-8 flex gap-3 cursor-pointer items-center flex-shrink-1">
        {issueData?.project_id && (
          <div className="flex-shrink-0">
            <IssueIdentifier size="xs" issueId={blockId} projectId={issueData.project_id} variant="tertiary" />
          </div>
        )}
        <Tooltip tooltipContent={issueData?.name} isMobile={isMobile}>
          <span className="line-clamp-1 text-13 font-medium flex-shrink-1">{issueData?.name}</span>
        </Tooltip>
      </div>
      <div className="flex items-center text-tertiary flex-shrink-0 pointer-events-none">
        <DateDropdown
          buttonVariant="transparent-with-text"
          icon={<StartDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
          placeholder="--"
          onChange={() => {}}
          value={issueBlock.start_date ?? null}
          disabled
        />{" "}
        -{" "}
        <DateDropdown
          buttonVariant="transparent-with-text"
          icon={<DueDatePropertyIcon className="h-3 w-3 flex-shrink-0" />}
          placeholder="--"
          onChange={() => {}}
          value={issueBlock.target_date ?? null}
          disabled
        />
      </div>
    </ControlLink>
  );
});

type DependencyPathProps = {
  relation: Relation | undefined;
  handleClose: () => void;
  isEpic?: boolean;
};

export const DependencyPathModal = observer(function DependencyPathModal(props: DependencyPathProps) {
  const { relation, handleClose, isEpic = false } = props;
  const { workspaceSlug, projectId } = useParams();
  // state
  const [isRemoving, setIsRemoving] = useState(false);
  // plane hooks
  const { t } = useTranslation();
  // derived values
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
      const relationProjectId: string = relation?.projectId ?? projectId?.toString();

      if (!relation || !relationType || !relationProjectId) return;

      setIsRemoving(true);

      await removeRelation(
        workspaceSlug.toString(),
        relationProjectId,
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
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Error while removing relation.",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const strokeColor = relation?.isAdhering ? "#3f76ff" : "#dc3e3e";

  return (
    <ModalCore
      isOpen={!!relation}
      handleClose={() => handleClose()}
      position={EModalPosition.CENTER}
      width={EModalWidth.LG}
    >
      {relation && (
        <>
          <div className="relative flex flex-col py-2">
            <div className="h-6 text-16 flex px-2 mt-2 items-end font-medium">
              <span>Timeline Relation</span>
            </div>
            <IssueBlock
              blockId={relation.originBlock}
              dependencyPosition={relation.originDependencyPosition}
              className="mt-2"
              handleClose={handleClose}
              isEpic={isEpic}
            />

            <div
              className={`relative flex items-center justify-between gap-1 mx-2 px-2 h-14 rounded-sm w-auto !bg-surface-1`}
            >
              <div className="flex items-center gap-1 h-full">
                <DependencyLineSVG strokeColor={strokeColor} />
                <span className="text-13 font-medium leading-5" style={{ color: strokeColor }}>
                  {relationObject?.i18n_label ? t(relationObject?.i18n_label) : ""}
                </span>
              </div>

              {isRemoving ? (
                <Spinner />
              ) : (
                <Tooltip tooltipContent="Remove relation">
                  <Trash2Icon className="h-5 w-5 cursor-pointer text-placeholder" onClick={handleRemoveRelation} />
                </Tooltip>
              )}
            </div>

            <IssueBlock
              blockId={relation.destinationBlock}
              dependencyPosition={relation.destinationDependencyPosition}
              className="mb-2"
              handleClose={handleClose}
              isEpic={isEpic}
            />
          </div>
        </>
      )}
    </ModalCore>
  );
});
