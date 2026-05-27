"use client";

import { observer } from "mobx-react";
import { Pencil, Trash2, Upload, Users2Icon } from "lucide-react";
import { Button } from "@plane/propel/button";
import type { IRosterPlayer, TRosterPlayerStatus } from "@plane/types";
import { Avatar, CustomMenu, cn } from "@plane/ui";
import { useRoster } from "../roster-context";
import { formatTimestamp, toDisplayStatus } from "../utils/roster.utils";

const statusStyles: Record<TRosterPlayerStatus, string> = {
  active: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  injured: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  inactive: "border-custom-border-300 bg-custom-background-90 text-custom-text-300",
  pending: "border-sky-500/30 bg-sky-500/10 text-sky-300",
};

const StatusPill = ({ status }: { status: TRosterPlayerStatus }) => (
  <span
    className={cn(
      "inline-flex min-w-[78px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-medium",
      statusStyles[status]
    )}
  >
    {toDisplayStatus(status)}
  </span>
);

const RosterActions = observer(({ player }: { player: IRosterPlayer }) => {
  const { canManage, openEditPlayerModal, openDeletePlayerModal } = useRoster();

  if (!canManage) return null;

  return (
    <div className="flex justify-end">
      <CustomMenu
        ellipsis
        placement="bottom-end"
        closeOnSelect
        buttonClassName="rounded-md border border-transparent p-1.5 text-custom-text-400 transition-colors hover:border-custom-border-200 hover:bg-custom-background-80 hover:text-custom-text-200"
      >
        <CustomMenu.MenuItem className="flex items-center gap-2" onClick={() => openEditPlayerModal(player)}>
          <Pencil className="h-3 w-3" />
          Edit player
        </CustomMenu.MenuItem>
        <CustomMenu.MenuItem
          className="flex items-center gap-2 text-red-400"
          onClick={() => openDeletePlayerModal(player)}
        >
          <Trash2 className="h-3 w-3" />
          Delete player
        </CustomMenu.MenuItem>
      </CustomMenu>
    </div>
  );
});

export const RosterTable = observer(({ players }: { players: IRosterPlayer[] }) => {
  const { displayProperties } = useRoster();

  return (
    <div className="hidden px-6 pb-6 md:block">
      <div className="overflow-hidden rounded-lg border border-custom-border-200 bg-custom-background-100">
        <div className="horizontal-scrollbar scrollbar-sm w-full overflow-x-auto overflow-y-hidden">
          <table className="min-w-max w-full whitespace-nowrap">
            <thead className="border-b border-custom-border-200 bg-custom-background-90">
              <tr className="text-left text-xs font-medium uppercase tracking-wide text-custom-text-400">
                {displayProperties.player ? <th className="px-4 py-3">Player</th> : null}
                {displayProperties.jersey_number ? <th className="px-4 py-3">Jersey #</th> : null}
                {displayProperties.position ? <th className="px-4 py-3">Position</th> : null}
                {displayProperties.height ? <th className="px-4 py-3">Height</th> : null}
                {displayProperties.weight ? <th className="px-4 py-3">Weight</th> : null}
                {displayProperties.class_year ? <th className="px-4 py-3">Class/Year</th> : null}
                {displayProperties.status ? <th className="px-4 py-3">Status</th> : null}
                {displayProperties.notes ? <th className="px-4 py-3">Notes</th> : null}
                {displayProperties.created_at ? <th className="px-4 py-3">Created at</th> : null}
                {displayProperties.updated_at ? <th className="px-4 py-3">Updated at</th> : null}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => (
                <tr
                  key={player.id}
                  className="border-b border-custom-border-200 text-sm text-custom-text-200 transition-colors last:border-b-0 hover:bg-custom-background-90/60"
                >
                  {displayProperties.player ? (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={player.player_name} size="base" />
                        <div className="font-medium text-custom-text-100">{player.player_name}</div>
                      </div>
                    </td>
                  ) : null}
                  {displayProperties.jersey_number ? (
                    <td className="px-4 py-3 text-custom-text-100">{player.jersey_number ? `#${player.jersey_number}` : "—"}</td>
                  ) : null}
                  {displayProperties.position ? <td className="px-4 py-3">{player.position || "—"}</td> : null}
                  {displayProperties.height ? <td className="px-4 py-3">{player.height || "—"}</td> : null}
                  {displayProperties.weight ? <td className="px-4 py-3">{player.weight || "—"}</td> : null}
                  {displayProperties.class_year ? <td className="px-4 py-3">{player.class_year || "—"}</td> : null}
                  {displayProperties.status ? (
                    <td className="px-4 py-3">
                      <StatusPill status={player.status} />
                    </td>
                  ) : null}
                  {displayProperties.notes ? <td className="px-4 py-3">{player.notes || "—"}</td> : null}
                  {displayProperties.created_at ? <td className="px-4 py-3">{formatTimestamp(player.created_at)}</td> : null}
                  {displayProperties.updated_at ? <td className="px-4 py-3">{formatTimestamp(player.updated_at)}</td> : null}
                  <td className="px-4 py-3">
                    <RosterActions player={player} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

export const RosterMobileCards = observer(({ players }: { players: IRosterPlayer[] }) => {
  const { displayProperties, activeView } = useRoster();

  return (
    <div className="grid gap-3 px-6 pb-6 md:hidden">
      {players.map((player) => (
        <div
          key={player.id}
          className="rounded-lg border border-custom-border-200 bg-custom-background-100 p-4 text-sm text-custom-text-200"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar name={player.player_name} size="base" />
              <div>
                <div className="font-medium text-custom-text-100">{player.player_name}</div>
                <div className="text-xs text-custom-text-400">
                  {player.jersey_number ? `#${player.jersey_number}` : "No jersey"}
                  {player.position ? ` • ${player.position}` : ""}
                </div>
              </div>
            </div>
            <div className="flex items-center text-custom-text-400">
              <RosterActions player={player} />
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            {displayProperties.height ? (
              <div>
                <div className="text-custom-text-400">Height</div>
                <div className="mt-1 text-sm text-custom-text-200">{player.height || "—"}</div>
              </div>
            ) : null}
            {displayProperties.weight ? (
              <div>
                <div className="text-custom-text-400">Weight</div>
                <div className="mt-1 text-sm text-custom-text-200">{player.weight || "—"}</div>
              </div>
            ) : null}
            {displayProperties.class_year ? (
              <div>
                <div className="text-custom-text-400">Class/Year</div>
                <div className="mt-1 text-sm text-custom-text-200">{player.class_year || "—"}</div>
              </div>
            ) : null}
            {displayProperties.status ? (
              <div>
                <div className="text-custom-text-400">Status</div>
                <div className="mt-1">
                  <StatusPill status={player.status} />
                </div>
              </div>
            ) : null}
            {displayProperties.notes ? (
              <div className={cn(activeView === "grid" ? "col-span-2" : "", "col-span-2")}>
                <div className="text-custom-text-400">Notes</div>
                <div className="mt-1 text-sm text-custom-text-200">{player.notes || "—"}</div>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
});

export const RosterLoadingState = () => (
  <div className="space-y-3 px-6 pb-6">
    {Array.from({ length: 4 }).map((_, index) => (
      <div
        key={index}
        className="h-16 animate-pulse rounded-lg border border-custom-border-200 bg-custom-background-90"
      />
    ))}
  </div>
);

export const RosterEmptyState = observer(() => {
  const { canManage, openImportRosterModal } = useRoster();

  return (
    <div className="px-6 pb-6">
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-custom-border-300 bg-custom-background-90 px-6 py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-custom-border-200 bg-custom-background-100 text-custom-text-300">
          <Users2Icon className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold text-custom-text-100">No roster added yet.</h2>
        <p className="mt-2 max-w-md text-sm text-custom-text-300">
          Add players manually or import a roster file to get started.
        </p>
        {canManage ? (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            <Button variant="neutral-primary" size="sm" prependIcon={<Upload />} onClick={openImportRosterModal}>
              Import roster
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
});
