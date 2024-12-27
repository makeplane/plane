"use client";

import React, { FC, useState } from "react";
import { observer } from "mobx-react";
// Plane
import { Collapsible } from "@plane/ui";
//
import { InitiativeLinksCollapsibleContent } from "./content";
import { InitiativeLinksCollapsibleTitle } from "./title";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled?: boolean;
};

export const LinksCollapsible: FC<Props> = observer((props) => {
  const { workspaceSlug, initiativeId, disabled = false } = props;
  // store hooks
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible
      isOpen={isOpen}
      onToggle={() => setIsOpen((prevState) => !prevState)}
      title={<InitiativeLinksCollapsibleTitle isOpen={isOpen} initiativeId={initiativeId} disabled={disabled} />}
      buttonClassName="w-full"
    >
      <InitiativeLinksCollapsibleContent
        workspaceSlug={workspaceSlug}
        initiativeId={initiativeId}
        disabled={disabled}
      />
    </Collapsible>
  );
});
