/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { EvaImportForm } from "./eva-import-form";
import { PrevImports } from "./prev-imports";

export const ImportGuide = observer(function ImportGuide() {
  const { workspaceSlug } = useParams();

  return (
    <div className="flex size-full flex-col gap-y-13">
      <EvaImportForm workspaceSlug={workspaceSlug?.toString() ?? ""} />
      <PrevImports workspaceSlug={workspaceSlug?.toString() ?? ""} />
    </div>
  );
});
