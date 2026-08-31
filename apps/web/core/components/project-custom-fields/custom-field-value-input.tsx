/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IProjectCustomFieldValue } from "@plane/types";

type Props = {
  value: IProjectCustomFieldValue | undefined;
  disabled: boolean;
  onSave: (valueDecimal: string | null) => Promise<unknown>;
};

// Numeric text kept as a plain string while editing so the input never fights the
// user over decimal points or a trailing minus sign mid-type.
const isValidDecimalInput = (raw: string) => raw === "" || /^-?\d*\.?\d*$/.test(raw);

export const ProjectCustomFieldValueInput = observer(function ProjectCustomFieldValueInput(props: Props) {
  const { value, disabled, onSave } = props;
  const { t } = useTranslation();
  const [draft, setDraft] = useState(value?.value_decimal ?? "");

  useEffect(() => {
    setDraft(value?.value_decimal ?? "");
  }, [value?.value_decimal]);

  const handleBlur = async () => {
    const original = value?.value_decimal ?? "";
    if (draft === original) return;
    try {
      await onSave(draft === "" ? null : draft);
    } catch (error) {
      setDraft(original);
      setToast({
        type: TOAST_TYPE.ERROR,
        title: t("project_custom_field.settings.toasts.value_update.error.title"),
        message: t("project_custom_field.settings.toasts.value_update.error.message"),
      });
    }
  };

  return (
    <InputGroup size="lg">
      <Input
        size="lg"
        type="text"
        value={draft}
        disabled={disabled}
        placeholder={t("project_custom_field.settings.value_placeholder")}
        onChange={(e) => {
          if (isValidDecimalInput(e.target.value)) setDraft(e.target.value);
        }}
        onBlur={handleBlur}
      />
    </InputGroup>
  );
});
