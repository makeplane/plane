/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import { Button } from "@makeplane/propel/components/button";
import {
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogHeader,
  DialogHeading,
  DialogMain,
  DialogTitle,
} from "@makeplane/propel/components/dialog";
import { useTranslation } from "@plane/i18n";
import type { IWebhook } from "@plane/types";
// local imports
import { WebhookSecretKey } from "./form";

type Props = {
  handleClose: () => void;
  webhookDetails: IWebhook;
};

export function GeneratedHookDetails(props: Props) {
  const { handleClose, webhookDetails } = props;
  const { t } = useTranslation();

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
          <WebhookSecretKey data={webhookDetails} />
        </DialogBody>
      </DialogMain>
      <DialogActions>
        <Button variant="secondary" size="md" stretch="auto" label={t("close")} onClick={handleClose} />
      </DialogActions>
    </>
  );
}
