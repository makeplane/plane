import { useState } from "react";
import { observer } from "mobx-react";
import { useParams, useSearchParams } from "next/navigation";
import { mutate } from "swr";
// constants
import { EXPORT_SERVICES_LIST } from "@/constants/fetch-keys";
// local imports
import { ExportForm } from "./export-form";
import { PrevExports } from "./prev-exports";

export const ExportGuide = observer(function ExportGuide() {
  // router
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider");
  // state
  const per_page = 10;
  const [cursor, setCursor] = useState<string | undefined>(`10:0:0`);

  return (
    <>
      <div className="size-full flex flex-col gap-y-13">
        <ExportForm
          workspaceSlug={workspaceSlug}
          provider={provider}
          mutateServices={() => mutate(EXPORT_SERVICES_LIST(workspaceSlug, `${cursor}`, `${per_page}`))}
        />
        <PrevExports workspaceSlug={workspaceSlug} cursor={cursor} per_page={per_page} setCursor={setCursor} />
      </div>
    </>
  );
});
