"use client";

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ListFilter, Search, SlidersHorizontal, Upload } from "lucide-react";
import type { EProjectFeatureKey } from "@plane/constants";
import { Breadcrumbs, Button, Header, Input } from "@plane/ui";
import { CountChip } from "@/components/common/count-chip";
import { useProject } from "@/hooks/store/use-project";
import { CommonProjectBreadcrumbs } from "@/plane-web/components/breadcrumbs/common";
import { RosterDisplayDropdown, RosterFilterDropdown } from "./components/roster-dropdowns";
import { useRoster } from "./roster-context";

export const ProjectRosterHeader = observer(() => {
  const { workspaceSlug, projectId } = useParams() as { workspaceSlug: string; projectId: string };
  const { loader } = useProject();
  const { players, searchValue, setSearchValue, canManage, openImportRosterModal } = useRoster();

  return (
    <Header>
      <Header.LeftItem>
        <div className="flex items-center gap-2.5">
          <Breadcrumbs isLoading={loader === "init-loader"} className="flex-grow-0">
            <CommonProjectBreadcrumbs
              workspaceSlug={workspaceSlug?.toString() ?? ""}
              projectId={projectId?.toString() ?? ""}
              featureKey={"roster" as EProjectFeatureKey}
              isLast
            />
          </Breadcrumbs>
          <CountChip count={players.length} />
        </div>
      </Header.LeftItem>
      <Header.RightItem className="flex-1">
        <div className="relative w-full max-w-[28.75rem]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-custom-text-400" />
          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search roster"
            className="w-full border-custom-border-200 bg-custom-background-100 py-1.5 pl-9 pr-3 text-sm text-custom-text-200"
          />
        </div>
      </Header.RightItem>
      <Header.RightItem>
        <div className="flex gap-2">
          <RosterFilterDropdown
            title="Filter"
            icon={<ListFilter className="size-3.5" />}
            miniIcon={<ListFilter className="size-3.5" />}
          />
          <RosterDisplayDropdown
            title="Display"
            
            miniIcon={<SlidersHorizontal className="size-3.5" />}
          />
        </div>
        {canManage ? (
          <Button variant="primary" size="sm" prependIcon={<Upload />} onClick={openImportRosterModal}>
            Import roster
          </Button>
        ) : null}
      </Header.RightItem>
    </Header>
  );
});
