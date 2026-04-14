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

import { forwardRef } from "react";
// plane imports
import type { PQLEditorHandle, PQLEditorProps } from "@plane/editor";
import { PQLEditorWithRef } from "@plane/editor";
import { useTranslation } from "@plane/i18n";

type Props = Pick<
  PQLEditorProps,
  "disableSubmit" | "fieldDefs" | "hideSubmit" | "isSubmitting" | "onChange" | "onSubmit" | "value"
>;

export const PQLEditor = forwardRef(function PQLEditor(props: Props, ref: React.ForwardedRef<PQLEditorHandle>) {
  const { disableSubmit, fieldDefs, hideSubmit, isSubmitting, onChange, onSubmit, value } = props;
  // translation
  const { t } = useTranslation();

  return (
    <PQLEditorWithRef
      editable
      value={value}
      className="border-[0.5px] border-subtle-1 bg-layer-2 rounded-lg py-1.5 px-2"
      onChange={onChange}
      onSubmit={onSubmit}
      disableSubmit={disableSubmit}
      hideSubmit={hideSubmit}
      isSubmitting={isSubmitting}
      placeholder={t("pql.placeholder")}
      fieldDefs={fieldDefs}
      ref={ref}
    />
  );
});
