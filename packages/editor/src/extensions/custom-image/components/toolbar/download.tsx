/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { DownloadOutline } from "@makeplane/propel/icons";
// plane imports
import { Tooltip } from "@makeplane/propel/components/tooltip";

type Props = {
  src: string;
};

export function ImageDownloadAction(props: Props) {
  const { t } = useTranslation();

  const { src } = props;

  return (
    <Tooltip label={t("page_navigation_pane.tabs.assets.download_button")}>
      <button
        type="button"
        onClick={() => window.open(src, "_blank")}
        className="grid h-full flex-shrink-0 place-items-center text-white/60 transition-colors hover:text-white"
        aria-label={t("web_ui.download_image")}
      >
        <DownloadOutline className="size-3" />
      </button>
    </Tooltip>
  );
}
