"use client";

import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
import { useRoster } from "../store/roster-context";
import { RosterEmptyState } from "./roster-empty-state";
import { RosterTable } from "./roster-list";
import { AddPlayerModal, DeletePlayerModal, ImportRosterModal } from "./roster-modals";

const ProgramRosterPage = observer(() => {
  const { allPlayers, players, groupedRoster, isLoading } = useRoster();
  const showEmptyState = !isLoading && allPlayers.length === 0;

  return (
    <>
      <PageHead title="Roster" />
      <div className="flex h-full w-full flex-col">
        {showEmptyState ? <RosterEmptyState /> : <RosterTable players={players} groupedRoster={groupedRoster} isLoading={isLoading} />}
        <AddPlayerModal />
        <ImportRosterModal />
        <DeletePlayerModal />
      </div>
    </>
  );
});

export default ProgramRosterPage;
