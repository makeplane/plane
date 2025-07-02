"use client";
import React, { FC } from "react";
// components
import { LinkList } from "../link-items";
// helper
import { useLinkOperations } from "../link-items/links-helper";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
};

export const InitiativeLinksCollapsibleContent: FC<Props> = (props) => {
  const { workspaceSlug, initiativeId, disabled } = props;
  // helper
  const handleLinkOperations = useLinkOperations(workspaceSlug, initiativeId);
  return <LinkList initiativeId={initiativeId} linkOperations={handleLinkOperations} disabled={disabled} />;
};
