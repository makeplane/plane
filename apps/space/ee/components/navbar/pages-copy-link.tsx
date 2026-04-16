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

// plane imports
import { CopyLinkIcon } from "@plane/propel/icons";
import { IconButton } from "@plane/propel/icon-button";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { copyUrlToClipboard } from "@plane/utils";

export type PagesCopyLinkProps = { anchor: string };

export const PagesCopyLink = function PagesCopyLink(props: PagesCopyLinkProps) {
  const { anchor } = props;

  const handleCopyLink = async () => {
    try {
      await copyUrlToClipboard(`/spaces/pages/${anchor}/`);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Page link copied to clipboard",
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Failed to copy link",
      });
    }
  };

  return (
    <Tooltip tooltipContent="Copy link">
      <IconButton variant="secondary" size="lg" onClick={handleCopyLink} icon={CopyLinkIcon} />
    </Tooltip>
  );
};
