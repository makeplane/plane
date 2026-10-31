/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { InputField } from "@makeplane/propel/components/input-field";
import { CALENDAR_KINDS, countByPerson, filterPeopleByName, getKindShares } from "@plane/services";
import type { TKindCounts } from "@plane/services";
import type { TTeamCalendarDay } from "@plane/types";
import { cn } from "@plane/utils";
// components
import { ButtonAvatars } from "@/components/dropdowns/member/avatar";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { DAY_KIND_META, DayKindDot } from "./work-mode";

type Props = {
  /** The days of the month being shown (not the padding days around it). */
  days: TTeamCalendarDay[];
  totals: TKindCounts;
  /** People in scope, ordered by name. */
  userIds: string[];
  /** The person the view is narrowed to, if any. */
  selectedUserId: string | undefined;
  onSelectUser: (userId: string | undefined) => void;
};

const MEMBER_COUNT_KINDS = ["ONSITE", "REMOTE", "OFF", "LEAVE"] as const;

/** Legend, the month's statistics and the list of people, with a search that narrows to one person. */
export const TeamSidePanel = observer(function TeamSidePanel(props: Props) {
  const { days, totals, userIds, selectedUserId, onSelectUser } = props;
  // states
  const [query, setQuery] = useState("");
  // hooks
  const { getUserDetails } = useMember();

  const shares = useMemo(() => getKindShares(totals), [totals]);
  const perPerson = useMemo(() => countByPerson(days), [days]);
  const people = filterPeopleByName(userIds, (userId) => getUserDetails(userId)?.display_name, query);

  return (
    <div className="flex flex-col gap-4">
      <section aria-label="Legend" className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h2 className="mb-2 text-body-sm-medium text-primary">Legend</h2>
        <ul className="flex flex-col gap-1.5">
          {CALENDAR_KINDS.map((kind) => (
            <li key={kind} className="flex items-center gap-2 text-body-sm-regular text-secondary">
              <DayKindDot kind={kind} />
              {DAY_KIND_META[kind].label}
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Month statistics" className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h2 className="mb-2 text-body-sm-medium text-primary">Month statistics</h2>
        {shares.length === 0 ? (
          <p className="text-caption-sm-regular text-tertiary">Nothing is planned in this month yet.</p>
        ) : (
          <>
            <div
              role="img"
              aria-label="Share of days by plan"
              className="flex h-2 overflow-hidden rounded-full bg-layer-1"
            >
              {shares.map((share) => (
                <span
                  key={share.kind}
                  className={DAY_KIND_META[share.kind].dot}
                  style={{ width: `${share.percent}%` }}
                />
              ))}
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {shares.map((share) => (
                <li key={share.kind} className="flex items-center justify-between text-body-sm-regular">
                  <span className="flex items-center gap-2 text-secondary">
                    <DayKindDot kind={share.kind} />
                    {DAY_KIND_META[share.kind].label}
                  </span>
                  <span className="text-primary tabular-nums">
                    {share.count} <span className="text-tertiary">({Math.round(share.percent)}%)</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section aria-label="People" className="rounded-lg border border-subtle bg-surface-1 p-4">
        <h2 className="mb-2 text-body-sm-medium text-primary">People ({userIds.length})</h2>
        <InputField
          type="search"
          size="lg"
          orientation="vertical"
          aria-label="Search people"
          placeholder="Search people"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <ul className="mt-2 flex max-h-96 flex-col overflow-y-auto">
          {people.map((userId) => {
            const counts = perPerson[userId];
            const isSelected = selectedUserId === userId;
            return (
              <li key={userId}>
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectUser(isSelected ? undefined : userId)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-layer-1",
                    isSelected && "bg-layer-1"
                  )}
                >
                  <ButtonAvatars showTooltip={false} userIds={userId} size="xs" />
                  <span className="min-w-0 grow truncate text-body-sm-regular text-primary">
                    {getUserDetails(userId)?.display_name ?? "Unknown"}
                  </span>
                  {counts ? (
                    <span className="flex shrink-0 items-center gap-1.5 text-caption-sm-regular text-tertiary tabular-nums">
                      {MEMBER_COUNT_KINDS.filter((kind) => counts[kind] > 0).map((kind) => (
                        <span key={kind} className="flex items-center gap-0.5" title={DAY_KIND_META[kind].label}>
                          <DayKindDot kind={kind} />
                          {counts[kind]}
                        </span>
                      ))}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
          {people.length === 0 ? (
            <li className="px-2 py-1.5 text-caption-sm-regular text-tertiary">Nobody matches.</li>
          ) : null}
        </ul>
      </section>
    </div>
  );
});
