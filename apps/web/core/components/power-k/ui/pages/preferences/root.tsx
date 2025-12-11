import React from "react";
import { observer } from "mobx-react";
// components
import type { TPowerKPageType } from "@/components/power-k/core/types";
// local imports
import { PowerKPreferencesLanguagesMenu } from "./languages-menu";
import { PowerKPreferencesStartOfWeekMenu } from "./start-of-week-menu";
import { PowerKPreferencesThemesMenu } from "./themes-menu";
import { PowerKPreferencesTimezonesMenu } from "./timezone-menu";

type Props = {
  activePage: TPowerKPageType | null;
  handleSelection: (data: unknown) => void;
};

export const PowerKAccountPreferencesPages = observer(function PowerKAccountPreferencesPages(props: Props) {
  const { activePage, handleSelection } = props;

  return (
    <>
      {activePage === "update-theme" && <PowerKPreferencesThemesMenu onSelect={handleSelection} />}
      {activePage === "update-timezone" && <PowerKPreferencesTimezonesMenu onSelect={handleSelection} />}
      {activePage === "update-start-of-week" && <PowerKPreferencesStartOfWeekMenu onSelect={handleSelection} />}
      {activePage === "update-language" && <PowerKPreferencesLanguagesMenu onSelect={handleSelection} />}
    </>
  );
});
