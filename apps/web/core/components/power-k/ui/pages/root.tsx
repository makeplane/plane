"use client";

import React from "react";
import { observer } from "mobx-react";
// local imports
import { TPowerKCommandConfig, TPowerKContext, TPowerKPageType } from "../../core/types";
import { PowerKModalDefaultPage } from "./default";
import { PowerKOpenEntityActions } from "./open-entity-actions/root";

type Props = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  onCommandSelect: (command: TPowerKCommandConfig) => void;
  onPageDataSelect: (value: unknown) => void;
};

export const PowerKModalPagesList: React.FC<Props> = observer((props) => {
  const { activePage, context, onCommandSelect, onPageDataSelect } = props;

  // Main page content (no specific page)
  if (!activePage) {
    return <PowerKModalDefaultPage context={context} onCommandSelect={onCommandSelect} />;
  }

  if (activePage.startsWith("open-")) {
    return <PowerKOpenEntityActions activePage={activePage} context={context} handleSelection={onPageDataSelect} />;
  }

  return null;
});
