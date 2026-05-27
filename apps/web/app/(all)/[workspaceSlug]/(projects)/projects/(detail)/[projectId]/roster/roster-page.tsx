"use client";

import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
import { RosterEmptyState, RosterLoadingState, RosterMobileCards, RosterTable } from "./components/roster-list";
import { AddPlayerModal, DeletePlayerModal, ImportRosterModal } from "./components/roster-modals";
import { useRoster } from "./roster-context";

const ProgramRosterPage = observer(() => {
  const { players, isLoading } = useRoster();

  return (
    <>
      <PageHead title="Roster" />
      <div className="flex h-full flex-col">
        <div className="flex-1 overflow-auto pt-4 pb-6">
          {isLoading ? (
            <RosterLoadingState />
          ) : players.length === 0 ? (
            <RosterEmptyState />
          ) : (
            <>
              <RosterTable players={players} />
              <RosterMobileCards players={players} />
            </>
          )}
        </div>
        <AddPlayerModal />
        <ImportRosterModal />
        <DeletePlayerModal />
      </div>
    </>
  );
});

export default ProgramRosterPage;
