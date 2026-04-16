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
        <PowerKModalCommandItem
          key={language.value}
          onSelect={() => onSelect(language.value)}
          label={
            language.label !== language.englishLabel ? `${language.label} (${language.englishLabel})` : language.label
          }
        />
      ))}
    </Command.Group>
  );
});
