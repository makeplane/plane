/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import { mutate } from "swr";
// constants
import { EXPORT_SERVICES_LIST } from "@plane/constants";
// local imports
import { ExportForm } from "./export-form";
import { PrevExports } from "./prev-exports";

type Props = {
  isExportFormOpen: boolean;
  onExportFormClose: () => void;
};

export const ExportGuide = observer(function ExportGuide(props: Props) {
  const { isExportFormOpen, onExportFormClose } = props;
  // router
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");
  // state
  const per_page = 10;
  const [cursor, setCursor] = useState<string | undefined>(`10:0:0`);

  return (
    <>
      <div className="flex size-full flex-col gap-y-13">
        <ExportForm
          isOpen={isExportFormOpen}
          onClose={onExportFormClose}
          workspaceSlug={workspaceSlug}
          provider={provider}
          mutateServices={() => mutate(EXPORT_SERVICES_LIST(workspaceSlug, `${cursor}`, `${per_page}`))}
        />
        <PrevExports workspaceSlug={workspaceSlug} cursor={cursor} per_page={per_page} setCursor={setCursor} />
      </div>
    </>
  );
});
