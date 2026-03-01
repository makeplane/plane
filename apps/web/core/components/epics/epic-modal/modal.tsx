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
import type { TIssue } from "@plane/types";
// components
// constants
// plane web providers
import { CreateUpdateEpicModalBase } from "./base";
import { EpicModalProvider } from "./provider";

export interface EpicModalProps {
  data?: Partial<TIssue>;
  isOpen: boolean;
  onClose: () => void;
  beforeFormSubmit?: () => Promise<void>;
  onSubmit?: (res: TIssue) => Promise<void>;
  fetchIssueDetails?: boolean;
  primaryButtonText?: {
    default: string;
    loading: string;
  };
  isProjectSelectionDisabled?: boolean;
  isConversionOperation?: boolean;
}

export const CreateUpdateEpicModal = observer(function CreateUpdateEpicModal(props: EpicModalProps) {
  return (
    props.isOpen && (
      <EpicModalProvider>
        <CreateUpdateEpicModalBase {...props} />
      </EpicModalProvider>
    )
  );
});
