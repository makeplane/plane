import React from "react";
import { observer } from "mobx-react";
// local imports
import type { TPowerKCommandConfig, TPowerKContext, TPowerKPageType } from "../../core/types";
import { PowerKModalDefaultPage } from "./default";
import { PowerKOpenEntityPages } from "./open-entity/root";
import { PowerKAccountPreferencesPages } from "./preferences";

type Props = {
  activePage: TPowerKPageType | null;
  context: TPowerKContext;
  onCommandSelect: (command: TPowerKCommandConfig) => void;
  onPageDataSelect: (value: unknown) => void;
};

export const PowerKModalPagesList = observer(function PowerKModalPagesList(props: Props) {
  const { activePage, context, onCommandSelect, onPageDataSelect } = props;

  // Main page content (no specific page)
  if (!activePage) {
    return <PowerKModalDefaultPage context={context} onCommandSelect={onCommandSelect} />;
  }

  return (
    <>
      <PowerKOpenEntityPages activePage={activePage} context={context} handleSelection={onPageDataSelect} />
      <PowerKAccountPreferencesPages activePage={activePage} handleSelection={onPageDataSelect} />
    </>
  );
});
