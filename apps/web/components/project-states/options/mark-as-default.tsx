/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useTranslation } from "@plane/i18n";
import { useState } from "react";
import { observer } from "mobx-react";
// plane imports
import type { TStateOperationsCallbacks } from "@plane/types";
import { cn } from "@plane/utils";

type TStateMarksAsDefault = {
  stateId: string;
  isDefault: boolean;
  markStateAsDefaultCallback: TStateOperationsCallbacks["markStateAsDefault"];
};

export const StateMarksAsDefault = observer(function StateMarksAsDefault(props: TStateMarksAsDefault) {
  const { t } = useTranslation();

  const { stateId, isDefault, markStateAsDefaultCallback } = props;
  // states
  const [isLoading, setIsLoading] = useState(false);

  const handleMarkAsDefault = async () => {
    if (!stateId || isDefault) return;
    setIsLoading(true);

    try {
      setIsLoading(false);
      await markStateAsDefaultCallback(stateId);
      setIsLoading(false);
    } catch {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={cn(
        "text-11 whitespace-nowrap transition-colors",
        isDefault ? "text-tertiary" : "text-secondary hover:text-primary"
      )}
      disabled={isDefault || isLoading}
      onClick={handleMarkAsDefault}
    >
      {isLoading ? t("web_ui.marking_as_default") : isDefault ? t("common.default") : t("web_ui.mark_as_default")}
    </button>
  );
});
