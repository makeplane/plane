/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { Button } from "@makeplane/propel/components/button";
import { ImageOutline } from "@makeplane/propel/icons";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import { sanitizeLogoImageUrl } from "../helper";
import { Logo } from "../logo";

type ImageRootProps = {
  /** Pre-fills the field, e.g. with the image logo currently in use. */
  defaultValue?: string;
  onChange: (value: { url: string }) => void;
};

/**
 * Image logo tab: takes an image URL, previews it and hands back the sanitized URL. Only `http(s):`
 * links and Plane asset paths (`/api/assets/...`) are accepted — see `sanitizeLogoImageUrl`.
 */
export function ImageRoot(props: ImageRootProps) {
  const { defaultValue = "", onChange } = props;
  const { t } = useTranslation();
  const [value, setValue] = useState(defaultValue);
  // derived values
  const safeUrl = sanitizeLogoImageUrl(value);
  const isInvalid = value.trim() !== "" && !safeUrl;
  const placeholderIcon = <ImageOutline className="size-4 text-placeholder" />;

  const handleApply = () => {
    if (safeUrl) onChange({ url: safeUrl });
  };

  return (
    <div className="flex flex-col gap-3 px-2 py-[15px]">
      <div className="flex items-center gap-2">
        <span className="grid size-10 flex-shrink-0 place-items-center overflow-hidden rounded-md bg-layer-1">
          {safeUrl ? (
            <Logo logo={{ in_use: "image", image: { url: safeUrl } }} size={28} fallback={placeholderIcon} />
          ) : (
            placeholderIcon
          )}
        </span>
        <input
          type="url"
          inputMode="url"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            handleApply();
          }}
          placeholder={t("common.type_or_paste_a_url")}
          aria-label={t("common.type_or_paste_a_url")}
          aria-invalid={isInvalid || undefined}
          className={cn(
            "block h-10 w-full rounded-lg border bg-transparent px-3 text-body-md-regular placeholder-(--text-color-placeholder) focus:outline-none",
            isInvalid ? "border-danger-strong" : "border-subtle focus:border-accent-strong"
          )}
        />
      </div>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="primary"
          size="sm"
          stretch="auto"
          label={t("common.apply")}
          disabled={!safeUrl}
          onClick={handleApply}
        />
      </div>
    </div>
  );
}
