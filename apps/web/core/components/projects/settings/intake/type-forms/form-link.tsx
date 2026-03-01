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

import { observer } from "mobx-react";
import { RefreshCcw } from "lucide-react";
import { CopyIcon, NewTabIcon } from "@plane/propel/icons";
import { SPACE_BASE_URL, SPACE_BASE_PATH } from "@plane/constants";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { cn } from "@plane/propel/utils";
import { Button } from "@plane/propel/button";
import { copyTextToClipboard } from "@plane/utils";

type Props = {
  anchor: string;
  handleRenew: () => void;
};
export const IntakeFormLink = observer(function IntakeFormLink(props: Props) {
  const { anchor, handleRenew } = props;

  const copyToClipboard = (text: string) => {
    copyTextToClipboard(text).then(() =>
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Copied to clipboard",
        message: "The URL has been successfully copied to your clipboard",
      })
    );
  };

  const SPACE_APP_URL = (SPACE_BASE_URL.trim() === "" ? window.location.origin : SPACE_BASE_URL) + SPACE_BASE_PATH;
  const publishLink = `${SPACE_APP_URL}/intake/forms/${anchor}`;

  return (
    <div className="flex gap-2 h-[30px] w-full">
      <div
        className={cn(
          "flex items-center text-13 rounded-md border-[0.5px] border-subtle-1 flex-1 py-1 px-2 gap-2 h-full"
        )}
      >
        <span className="truncate flex-1 mr-4">{publishLink}</span>
        <CopyIcon className="text-placeholder w-[16px] cursor-pointer" onClick={() => copyToClipboard(publishLink)} />
        <a href={publishLink} target="_blank" rel="noreferrer">
          <NewTabIcon className="text-placeholder w-[16px] cursor-pointer" />
        </a>
      </div>
      <Button
        tabIndex={-1}
        variant="secondary"
        className="w-fit cursor-pointer px-2 py-1 text-center text-13 font-medium outline-none my-auto h-full"
        onClick={handleRenew}
      >
        <RefreshCcw className="w-[16px]" /> Renew
      </Button>
    </div>
  );
});
