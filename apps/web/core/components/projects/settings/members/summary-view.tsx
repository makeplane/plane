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

import { CheckCircle2, AlertCircle, Download } from "lucide-react";
import { Dialog } from "@headlessui/react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TProjectMemberImportSummary } from "@plane/types";
import { Button } from "@plane/propel/button";
import { downloadSkippedDetails } from "@plane/utils";

type SummaryViewProps = { summary: TProjectMemberImportSummary; onClose: () => void };

export const SummaryView = (props: SummaryViewProps) => {
  const { summary, onClose } = props;

  const { t } = useTranslation();
  const totalImported = summary.members_added + summary.members_reactivated;
  const isSuccess = totalImported > 0;

  return (
    <>
      <div className="flex items-center gap-2">
        {isSuccess ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <AlertCircle className="h-5 w-5 text-warning" />
        )}
        <Dialog.Title className="text-h5-medium text-primary">
          {t("project.members_import.summary.title.complete")}
        </Dialog.Title>
      </div>

      <p className="mt-2 text-body-sm-regular text-secondary">
        {isSuccess
          ? t("project.members_import.summary.message.success", {
              count: totalImported,
              plural: totalImported !== 1 ? "s" : "",
            })
          : t("project.members_import.summary.message.no_imports")}
      </p>

      <div className="mt-4 rounded-lg bg-layer-1 border border-subtle px-4 py-3">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-caption-md-regular text-tertiary">{t("project.members_import.summary.stats.added")}</p>
            <p className="text-h5-medium text-success mt-2">{summary.members_added}</p>
          </div>
          <div>
            <p className="text-caption-md-regular text-tertiary">
              {t("project.members_import.summary.stats.reactivated")}
            </p>
            <p className="text-h5-medium text-success mt-2">{summary.members_reactivated}</p>
          </div>
          <div>
            <p className="text-caption-md-regular text-tertiary">
              {t("project.members_import.summary.stats.already_members")}
            </p>
            <p className="text-h5-medium text-tertiary mt-2">{summary.already_members}</p>
          </div>
          <div>
            <p className="text-caption-md-regular text-tertiary">{t("project.members_import.summary.stats.skipped")}</p>
            <p className="text-h5-medium text-danger mt-2">{summary.skipped}</p>
          </div>
        </div>
        {summary.skipped > 0 && (
          <Button
            variant="link"
            onClick={() => downloadSkippedDetails(summary.skipped_details)}
            prependIcon={<Download />}
            className="mt-3 px-0"
          >
            {t("project.members_import.summary.download_errors")}
          </Button>
        )}
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="primary" size="lg" onClick={onClose}>
          {t("project.members_import.buttons.done")}
        </Button>
      </div>
    </>
  );
};
