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
// types
import type { ScriptFunction } from "@plane/types";
// ui
import { EModalWidth, ModalCore } from "@plane/ui";
import { FunctionDetail } from "./function-detail";

type Props = {
  isOpen: boolean;
  functionData: ScriptFunction | null;
  onClose: () => void;
};

export const ViewFunctionModal = observer((props: Props) => {
  const { isOpen, onClose, functionData } = props;

  if (!functionData) return null;

  return (
    <ModalCore isOpen={isOpen} handleClose={onClose} width={EModalWidth.XXXL}>
      <div className="flex flex-col max-h-[85vh] p-6">
        <FunctionDetail fn={functionData} />
      </div>
    </ModalCore>
  );
});
