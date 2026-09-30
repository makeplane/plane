/**
 * Copyright (c) 2026 Okręgowa Spółdzielnia Mleczarska w Piątnicy
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { CustomSelect } from "@plane/ui";

export const AuthLanguageSelect = observer(function AuthLanguageSelect() {
  const { currentLocale, changeLanguage, languages } = useTranslation();

  const currentLanguageLabel = languages.find((language) => language.value === currentLocale)?.label ?? currentLocale;

  return (
    <CustomSelect
      value={currentLocale}
      label={<span className="text-body-sm-regular text-tertiary">{currentLanguageLabel}</span>}
      onChange={changeLanguage}
      buttonClassName="border-none px-2 py-1"
      placement="bottom-end"
      input
    >
      {languages.map((language) => (
        <CustomSelect.Option key={language.value} value={language.value}>
          {language.label}
        </CustomSelect.Option>
      ))}
    </CustomSelect>
  );
});
