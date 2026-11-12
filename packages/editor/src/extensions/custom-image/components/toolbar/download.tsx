/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { DownloadOutline } from "@makeplane/propel/icons";
// plane imports
import { Icon } from "@makeplane/propel/components/icon";
import { ToolbarButton } from "@makeplane/propel/elements/toolbar";
import { Tooltip } from "@makeplane/propel/components/tooltip";

type Props = {
  src: string;
};

export function ImageDownloadAction(props: Props) {
  const { src } = props;

  return (
    <Tooltip label="Download">
      <ToolbarButton
        type="button"
        size="sm"
        labeled={false}
        onClick={() => window.open(src, "_blank")}
        aria-label="Download image"
      >
        <Icon icon={DownloadOutline} />
      </ToolbarButton>
    </Tooltip>
  );
}
