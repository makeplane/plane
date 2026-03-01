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
// plane imports
import { Button } from "@plane/propel/button";
import { EUpdateStatus } from "@plane/types";
import { TextArea } from "@plane/ui";
// plane web types
import type { TProjectUpdate } from "@/types";
// components
import { StatusDropdown } from "./status-dropdown";

type TProps = {
  initialValues?: TProjectUpdate;
  handleClose: () => void;
  handleCreate: (data: Partial<TProjectUpdate>) => void;
};
export function NewUpdate(props: TProps) {
  const { handleClose, handleCreate, initialValues } = props;

  const [input, setInput] = useState(initialValues?.description ?? "");
  const [selectedStatus, setSelectedStatus] = useState(initialValues?.status ?? EUpdateStatus.ON_TRACK);

  return (
    <div className="border border-subtle rounded-md p-4 flex flex-col gap-4 mb-4">
      {/* Type */}
      <StatusDropdown selectedStatus={selectedStatus} setStatus={setSelectedStatus} />

      {/* Textarea */}
      <TextArea
        className="border-none p-0 text-13 min-h-4"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Add your update."
      />

      {/* actions */}
      <div className="flex m-auto mr-0 text-13 gap-2 w-fit">
        <Button onClick={handleClose} variant="secondary">
          Cancel
        </Button>
        <Button
          onClick={() =>
            handleCreate({
              status: selectedStatus,
              description: input,
            })
          }
          disabled={input === ""}
        >
          Add update
        </Button>
      </div>
    </div>
  );
}
