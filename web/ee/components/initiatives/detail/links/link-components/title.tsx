"use client";
import React, { FC, useMemo } from "react";
import { observer } from "mobx-react";
// Plane
import { CollapsibleButton } from "@plane/ui";
// components
import { IssueLinksActionButton } from "@/components/issues/issue-detail-widgets";
// hooks
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  isOpen: boolean;
  initiativeId: string;
  disabled: boolean;
};

export const InitiativeLinksCollapsibleTitle: FC<Props> = observer((props) => {
  const { isOpen, initiativeId, disabled } = props;
  // store hooks
  const {
    initiative: {
      initiativeLinks: { getInitiativeLinks },
    },
  } = useInitiatives();

  // derived values
  const initiativeLinks = getInitiativeLinks(initiativeId);

  const linksCount = initiativeLinks?.length ?? 0;

  // indicator element
  const indicatorElement = useMemo(
    () => (
      <span className="flex items-center justify-center ">
        <p className="text-base text-custom-text-300 !leading-3">{linksCount}</p>
      </span>
    ),
    [linksCount]
  );

  return (
    <CollapsibleButton
      isOpen={isOpen}
      title="Links"
      indicatorElement={indicatorElement}
      actionItemElement={!disabled && <IssueLinksActionButton disabled={disabled} />}
    />
  );
});
