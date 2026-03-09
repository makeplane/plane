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
// plane imports
import { Button } from "@plane/propel/button";
// local imports
import { ElementTransition } from "./transition-components";

type Props = {
  save: {
    callback?: () => Promise<void>;
    enabled: boolean;
    isSaving?: boolean;
    label?: string;
  };
  update: {
    callback?: () => Promise<void>;
    enabled: boolean;
    isUpdating: boolean;
    label?: string;
  };
};

export const RichFiltersViewControls = observer(function RichFiltersViewControls({ save, update }: Props) {
  return (
    <>
      <ElementTransition show={save.enabled}>
        <Button
          variant="secondary"
          onClick={() => void save.callback?.()}
          disabled={!save.enabled}
          loading={save.isSaving}
          className="shrink-0"
        >
          {save.label ?? "Save view"}
        </Button>
      </ElementTransition>
      <ElementTransition show={update.enabled}>
        <Button
          variant="secondary"
          onClick={() => void update.callback?.()}
          loading={update.isUpdating}
          disabled={!update.enabled}
          className="shrink-0"
        >
          {update.isUpdating ? "Confirming" : (update.label ?? "Update view")}
        </Button>
      </ElementTransition>
    </>
  );
});
