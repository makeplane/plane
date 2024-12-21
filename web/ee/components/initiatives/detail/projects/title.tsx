"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
// Plane
import { CollapsibleButton } from "@plane/ui";
// components
import { IssueLinksActionButton } from "@/components/issues/issue-detail-widgets";

type Props = {
  isOpen: boolean;
  projectsIds: string[] | undefined;
  disabled: boolean;
};

export const InitiativeProjectsCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, projectsIds, disabled } = props;

  const projectsCount = projectsIds?.length ?? 0;

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center ">
        <p className="text-base text-custom-text-300 !leading-3">{projectsCount}</p>
      </span>
    ),
    [projectsCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title="Projects"
      indicatorElement={indicatorElement}
      actionItemElement={!disabled && <IssueLinksActionButton disabled={disabled} />}
    />
  );
});
