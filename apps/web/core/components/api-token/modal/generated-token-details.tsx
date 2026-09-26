/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { Button } from "@makeplane/propel/components/button";
import { CopyOutline } from "@makeplane/propel/icons";
import { setToast } from "@plane/blocks/toast";
import { Tooltip } from "@makeplane/propel/components/tooltip";
import type { IApiToken } from "@plane/types";
import {
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogInfo,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { renderFormattedDate, renderFormattedTime, copyTextToClipboard } from "@plane/utils";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type Props = {
  handleClose: () => void;
  tokenDetails: IApiToken;
};

export function GeneratedTokenDetails(props: Props) {
  const { handleClose, tokenDetails } = props;
  const { isMobile } = usePlatformOS();
  const { t } = useTranslation();
  const copyApiToken = (token: string) => {
    copyTextToClipboard(token).then(() =>
      setToast({
        type: "success",
        title: `${t("success")}!`,
        message: t("workspace_settings.token_copied"),
      })
    );
  };

  return (
    <>
      <DialogMain>
        <DialogHeader>
          <DialogHeading>
            <DialogTitle>{t("workspace_settings.key_created")}</DialogTitle>
            <DialogDescription>{t("workspace_settings.copy_key")}</DialogDescription>
          </DialogHeading>
        </DialogHeader>
        <DialogBody>
          <button
            type="button"
            onClick={() => copyApiToken(tokenDetails.token ?? "")}
            className="flex w-full items-center justify-between truncate rounded-md border-[0.5px] border-subtle px-3 py-2 text-13 font-medium outline-none"
          >
            <span className="truncate pr-2">{tokenDetails.token}</span>
            <Tooltip label="Copy secret key" disabled={isMobile}>
              <CopyOutline className="h-4 w-4 flex-shrink-0 text-placeholder" />
            </Tooltip>
          </button>
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <DialogInfo>
          {tokenDetails.expired_at
            ? `Expires ${renderFormattedDate(tokenDetails.expired_at)} at ${renderFormattedTime(tokenDetails.expired_at)}`
            : "Never expires"}
        </DialogInfo>
        <Button variant="secondary" size="sm" stretch="auto" label={t("close")} onClick={handleClose} />
      </DialogActions>
    </>
  );
}
