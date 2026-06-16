import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChangeTable, FiltersBar } from "@/components/change-management";
import { useChangeManagement } from "@/hooks/store/use-change-management";
import type { IChangeFilters } from "@/services/change-management.service";

const AllChangesPage = observer(() => {
  const { workspaceSlug } = useParams();
  const store = useChangeManagement();
  const [filters, setFilters] = useState<IChangeFilters>({});

  useEffect(() => {
    if (workspaceSlug) {
      store.fetchChanges(workspaceSlug.toString(), filters);
    }
  }, [workspaceSlug, filters, store]);

  const changes = store.changeIds.map((id) => store.changeMap[id]).filter(Boolean);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-custom-background-100">
      <FiltersBar filters={filters} onChange={setFilters} />
      <div className="flex-1 overflow-y-auto p-6">
        <ChangeTable changes={changes} isLoading={store.loader} />
      </div>
    </div>
  );
});

export default AllChangesPage;
