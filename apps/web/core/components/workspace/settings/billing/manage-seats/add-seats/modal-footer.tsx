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

import React from "react";
import { Button } from "@plane/propel/button";
import { ChevronLeftIcon } from "@plane/propel/icons";
// plane imports
import { cn } from "@plane/utils";

type TModalFooterProps = {
  onPreviousStep?: () => void;
  onClose: () => void;
  onNext: (e: React.MouseEvent<HTMLButtonElement>) => void;
  loading: boolean;
  loadingText: string;
  nextButtonText: string;
};

export function ModalFooter(props: TModalFooterProps) {
  const { onPreviousStep, onClose, onNext, loading, loadingText, nextButtonText } = props;

  return (
    <div
      className={cn("p-5 flex items-center justify-end gap-2 border-t border-subtle-1", {
        "justify-between": onPreviousStep,
      })}
    >
      {onPreviousStep && (
        <Button variant="ghost" className="flex gap-1" onClick={onPreviousStep}>
          <ChevronLeftIcon className="size-3.5" />
          Go back
        </Button>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button variant="secondary" size="lg" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" size="lg" onClick={onNext} loading={loading}>
          {loading ? loadingText : nextButtonText}
        </Button>
      </div>
    </div>
  );
}
