"use client";

import { observer } from "mobx-react";
import { PageHead } from "@/components/core/page-title";
import { useRoster } from "../store/roster-context";
import { RosterTable } from "./roster-list";
import { AddPlayerModal, DeletePlayerModal, ImportRosterModal } from "./roster-modals";

const ProgramRosterPage = observer(() => {
  const { players, groupedRoster, isLoading } = useRoster();

  return (
    <>
      <PageHead title="Roster" />
      <div className="h-full w-full">
        <RosterTable players={players} groupedRoster={groupedRoster} isLoading={isLoading} />
        <AddPlayerModal />
        <ImportRosterModal />
        <DeletePlayerModal />
      </div>
    </>
  );
});

export default ProgramRosterPage;
