import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane
import { Header, EHeaderVariant } from "@plane/ui";
// Plane-web
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TInitiativeFilters } from "@/plane-web/types/initiative";
//
import { AppliedFiltersList } from "./";

// types

export const InitiativeAppliedFiltersRoot: React.FC = observer(() => {
  // router
  const { workspaceSlug } = useParams() as {
    workspaceSlug: string;
    projectId: string;
  };
  // store hooks
  const {
    initiativeFilters: { currentInitiativeFilters, updateFilters, clearAllFilters },
  } = useInitiatives();
  // filters whose value not null or empty array
  const appliedFilters: TInitiativeFilters = {};
  Object.entries(currentInitiativeFilters ?? {}).forEach(([key, value]) => {
    if (!value) return;
    if (Array.isArray(value) && value.length === 0) return;
    appliedFilters[key as keyof TInitiativeFilters] = value;
  });

  const handleRemoveFilter = (key: keyof TInitiativeFilters, value: string | null) => {
    if (!workspaceSlug) return;
    if (!value) {
      updateFilters(workspaceSlug.toString(), {
        [key]: null,
      });
      return;
    }

    let newValues = currentInitiativeFilters?.[key] ?? [];
    newValues = newValues.filter((val) => val !== value);

    updateFilters(workspaceSlug.toString(), {
      [key]: newValues,
    });
  };

  const handleClearAllFilters = () => {
    if (!workspaceSlug) return;
    const newFilters: TInitiativeFilters = {};
    Object.keys(currentInitiativeFilters ?? {}).forEach((key) => {
      newFilters[key as keyof TInitiativeFilters] = [];
    });
    clearAllFilters(workspaceSlug.toString());
  };

  // return if no filters are applied
  if (Object.keys(appliedFilters).length === 0) return null;

  return (
    <Header variant={EHeaderVariant.TERNARY}>
      <Header.LeftItem>
        <AppliedFiltersList
          appliedFilters={appliedFilters}
          handleClearAllFilters={handleClearAllFilters}
          handleRemoveFilter={handleRemoveFilter}
        />
      </Header.LeftItem>
    </Header>
  );
});
