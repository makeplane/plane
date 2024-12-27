"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
import { Plus } from "lucide-react";
// Plane
import { CollapsibleButton } from "@plane/ui";

type Props = {
  isOpen: boolean;
  projectsIds: string[] | undefined;
  handleOnClick: () => void;
  disabled: boolean;
};

export const InitiativeProjectsCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, projectsIds, handleOnClick, disabled } = props;

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
      actionItemElement={
        !disabled && (
          <button type="button" onClick={handleOnClick} disabled={disabled}>
            <Plus className="h-4 w-4" />
          </button>
        )
      }
    />
  );
});
