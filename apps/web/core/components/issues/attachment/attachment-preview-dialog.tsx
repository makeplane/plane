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

import { useMemo } from "react";
import { useTranslation } from "@plane/i18n";
import { AttachmentPreviewDialog as BlocksPreviewDialog } from "@plane/blocks/common";
import type { AttachmentPreviewDialogProps } from "@plane/blocks/common";

export type IssueAttachmentPreviewDialogProps = Omit<AttachmentPreviewDialogProps, "labels">;

export function IssueAttachmentPreviewDialog(props: IssueAttachmentPreviewDialogProps) {
  const { t } = useTranslation();

  const labels = useMemo(
    () => ({
      ariaLabel: t("attachment.preview.aria_label"),
      download: t("attachment.preview.download"),
      close: t("attachment.preview.close"),
      previous: t("attachment.preview.previous"),
      next: t("attachment.preview.next"),
    }),
    [t]
  );

  return <BlocksPreviewDialog {...props} labels={labels} />;
}
