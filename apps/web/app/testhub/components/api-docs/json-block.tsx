/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { IconButton } from "@plane/propel/icon-button";
import { CopyIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { copyTextToClipboard } from "@plane/utils";

export function JsonBlock({ value }: { value: unknown }) {
  const { t } = useTranslation();
  const text = formatValue(value);

  const copy = () => {
    copyTextToClipboard(text).then(() => {
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: t("testhub.api.copied"),
      });
      return undefined;
    });
  };

  return (
    <div className="relative">
      <IconButton
        variant="ghost"
        size="sm"
        className="absolute top-1.5 right-1.5"
        icon={CopyIcon}
        onClick={copy}
        aria-label={t("testhub.api.copy")}
      />
      <pre className="overflow-auto rounded-md bg-layer-1 p-3 pr-10 text-12 whitespace-pre-wrap text-secondary">
        {text}
      </pre>
    </div>
  );
}

function formatValue(value: unknown): string {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}
