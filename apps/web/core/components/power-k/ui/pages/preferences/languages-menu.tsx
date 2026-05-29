import React from "react";
import { Command } from "cmdk";
import { observer } from "mobx-react";
// plane imports
import { SUPPORTED_LANGUAGES } from "@plane/i18n";
// local imports
import { PowerKModalCommandItem } from "../../modal/command-item";

type Props = {
  onSelect: (language: string) => void;
};

export const PowerKPreferencesLanguagesMenu = observer(function PowerKPreferencesLanguagesMenu(props: Props) {
  const { onSelect } = props;

  return (
    <Command.Group>
      {SUPPORTED_LANGUAGES.map((language) => (
        <PowerKModalCommandItem key={language.value} onSelect={() => onSelect(language.value)} label={language.label} />
      ))}
    </Command.Group>
  );
});
