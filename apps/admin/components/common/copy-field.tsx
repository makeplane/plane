/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useId } from "react";
import type { ReactNode } from "react";
// plane internal packages
import { Icon } from "@makeplane/propel/components/icon";
import { IconButton } from "@makeplane/propel/components/icon-button";
import { CopyOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { useTranslation } from "@plane/i18n";
import { copyTextToClipboard } from "@plane/utils";

type Props = {
  label: string;
  url: string;
  description: string | ReactNode;
};

export type TCopyField = {
  key: string;
  label: string;
  url: string;
  description: string | ReactNode;
};

export function CopyField(props: Props) {
  const { label, url, description } = props;
  // plane hooks
  const { t } = useTranslation();
  // ids linking the copy button to the field it copies
  const labelId = useId();
  const valueId = useId();

  const handleCopy = async () => {
    try {
      await copyTextToClipboard(url);
      setToast({ type: "success", title: t("copied_to_clipboard") });
    } catch (error) {
      console.error(error);
      setToast({ type: "error", title: t("common.clipboard_copy_failed") });
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span id={labelId} className="text-body-sm-medium text-primary">
        {label}
      </span>
      <div className="flex w-full min-w-0 items-start gap-2 rounded-lg border border-subtle bg-layer-2 px-3 py-2">
        <code id={valueId} className="min-w-0 flex-1 text-body-xs-regular break-all text-primary">
          {url}
        </code>
        <IconButton
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t("common.tooltip.copy_to_clipboard")}
          aria-describedby={`${labelId} ${valueId}`}
          icon={<Icon icon={CopyOutline} />}
          onClick={() => void handleCopy()}
        />
      </div>
      <div className="text-body-xs-regular text-tertiary">{description}</div>
    </div>
  );
}
