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

import { useState } from "react";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/propel/button";
import type { TUpdate } from "@plane/types";
import { EUpdateStatus } from "@plane/types";
import { TextArea } from "@plane/ui";
import { StatusDropdown } from "./status-dropdown";

type TProps = {
  initialValues?: TUpdate;
  handleClose: () => void;
  handleCreate: (data: Partial<TUpdate>) => void;
};
export function NewUpdate(props: TProps) {
  const { handleClose, handleCreate, initialValues } = props;
  const { t } = useTranslation();
  const [input, setInput] = useState(initialValues?.description ?? "");
  const [selectedStatus, setSelectedStatus] = useState(initialValues?.status ?? EUpdateStatus.ON_TRACK);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="border border-subtle rounded-md p-4 flex flex-col gap-4">
      {/* Type */}
      <StatusDropdown selectedStatus={selectedStatus} setStatus={setSelectedStatus} />

      {/* Textarea */}
      <TextArea
        className="border-none p-0 text-13 min-h-4"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={t("updates.add_update_placeholder")}
        autoFocus
      />

      {/* actions */}
      <div className="flex m-auto mr-0 text-13 gap-2 w-fit">
        <Button onClick={handleClose} variant="secondary">
          {t("cancel")}
        </Button>
        <Button
          onClick={async () => {
            setIsSubmitting(true);
            await handleCreate({
              status: selectedStatus,
              description: input,
            });
            setIsSubmitting(false);
          }}
          disabled={input === "" || isSubmitting}
        >
          {t("updates.add_update")}
        </Button>
      </div>
    </div>
  );
}
