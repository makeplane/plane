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

import { LinkIcon } from "@plane/propel/icons";
import { Button } from "@plane/propel/button";

type TModalHeaderProps = {
  pageTitle: string;
  copied: boolean;
  onCopyLink: () => void;
};

export function ModalHeader({ pageTitle, copied, onCopyLink }: TModalHeaderProps) {
  return (
    <div className="flex items-center justify-between pt-3 px-4">
      <h3 className="text-lg font-medium text-primary truncate">Share {pageTitle}</h3>
      <Button variant="link" prependIcon={<LinkIcon />} onClick={onCopyLink} className="shrink-0">
        {copied ? "Copied!" : "Copy link"}
      </Button>
    </div>
  );
}

ModalHeader.displayName = "ModalHeader";
