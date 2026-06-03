import { useState, useCallback } from "react";
import { observer } from "mobx-react";
import { Clock } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Popover } from "@plane/propel/popover";
import { cn } from "@plane/utils";
import { HoIssueService } from "@/plane-web/services/ho-issue.service";
import type {
  THoWorklogByUserEntry,
  THoWorklogBreakdown,
  THoWorklogMember,
} from "@/plane-web/services/ho-issue.service";
import { HoWorklogMembersView } from "./ho-worklog-members-view";
import { HoWorklogUserDetailView } from "./ho-worklog-user-detail-view";

const hoIssueService = new HoIssueService();

type Props = {
  issueId: string;
};

type View = "members" | "user-detail";

export const HoWorklogBreakdownPopover = observer(function HoWorklogBreakdownPopover({ issueId }: Props) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Members state
  const [view, setView] = useState<View>("members");
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [members, setMembers] = useState<THoWorklogMember[]>([]);
  const [membersPage, setMembersPage] = useState(1);
  const [membersHasNext, setMembersHasNext] = useState(false);
  const [isMembersInitial, setIsMembersInitial] = useState(false);
  const [isMembersMore, setIsMembersMore] = useState(false);
  const [membersError, setMembersError] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);

  // User-detail state
  const [selectedMember, setSelectedMember] = useState<THoWorklogMember | null>(null);
  const [entries, setEntries] = useState<THoWorklogByUserEntry[]>([]);
  const [entriesPage, setEntriesPage] = useState(1);
  const [entriesHasNext, setEntriesHasNext] = useState(false);
  const [isEntriesInitial, setIsEntriesInitial] = useState(false);
  const [isEntriesMore, setIsEntriesMore] = useState(false);
  const [entriesError, setEntriesError] = useState(false);

  const resetEntries = useCallback(() => {
    setEntries([]);
    setEntriesPage(1);
    setEntriesHasNext(false);
    setEntriesError(false);
  }, []);

  const resetAll = useCallback(() => {
    setView("members");
    setSelectedMember(null);
    resetEntries();
  }, [resetEntries]);

  const fetchMembers = useCallback(
    async (page: number) => {
      const isInitial = page === 1;
      if (isInitial) setIsMembersInitial(true);
      else setIsMembersMore(true);
      setMembersError(false);
      try {
        const data: THoWorklogBreakdown = await hoIssueService.listIssueWorklogBreakdown(issueId, page);
        setTotalMinutes(data.total_minutes ?? 0);
        setMembers((prev) => (isInitial ? data.members : [...prev, ...data.members]));
        setMembersHasNext(Boolean(data.next));
        setMembersPage(page);
        setMembersLoaded(true);
      } catch {
        setMembersError(true);
      } finally {
        if (isInitial) setIsMembersInitial(false);
        else setIsMembersMore(false);
      }
    },
    [issueId]
  );

  const fetchEntries = useCallback(
    async (userId: string, page: number) => {
      const isInitial = page === 1;
      if (isInitial) setIsEntriesInitial(true);
      else setIsEntriesMore(true);
      setEntriesError(false);
      try {
        const data = await hoIssueService.listIssueWorklogByUser(issueId, userId, page);
        setEntries((prev) => (isInitial ? data.results : [...prev, ...data.results]));
        setEntriesHasNext(Boolean(data.next));
        setEntriesPage(page);
      } catch {
        setEntriesError(true);
      } finally {
        if (isInitial) setIsEntriesInitial(false);
        else setIsEntriesMore(false);
      }
    },
    [issueId]
  );

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      resetAll();
      return;
    }
    if (!membersLoaded) void fetchMembers(1);
  };

  const handleSelectMember = (m: THoWorklogMember) => {
    setSelectedMember(m);
    setView("user-detail");
    resetEntries();
    void fetchEntries(m.user_id, 1);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <Popover.Button
        className={cn(
          "inline-flex items-center gap-1.5 rounded px-2 py-1 text-11 outline-none transition-colors",
          "border border-subtle bg-layer-2 text-primary hover:bg-layer-1",
          "focus-visible:ring-1 focus-visible:ring-accent-strong"
        )}
        aria-label={t("worklog.view_total")}
      >
        <Clock className="h-3 w-3 text-tertiary" />
        <span>{t("worklog.view_total")}</span>
      </Popover.Button>
      <Popover.Panel
        side="bottom"
        align="end"
        className="z-[25] w-80 overflow-hidden rounded-md border border-subtle bg-surface-1 shadow-lg"
      >
        {view === "members" ? (
          <HoWorklogMembersView
            totalMinutes={totalMinutes}
            members={members}
            isInitialLoading={isMembersInitial}
            isLoadingMore={isMembersMore}
            hasNext={membersHasNext}
            error={membersError}
            onLoadMore={() => void fetchMembers(membersPage + 1)}
            onRetry={() => void fetchMembers(members.length === 0 ? 1 : membersPage)}
            onSelectMember={handleSelectMember}
            t={t}
          />
        ) : (
          <HoWorklogUserDetailView
            member={selectedMember}
            entries={entries}
            isInitialLoading={isEntriesInitial}
            isLoadingMore={isEntriesMore}
            hasNext={entriesHasNext}
            error={entriesError}
            onLoadMore={() => selectedMember && void fetchEntries(selectedMember.user_id, entriesPage + 1)}
            onRetry={() =>
              selectedMember && void fetchEntries(selectedMember.user_id, entries.length === 0 ? 1 : entriesPage)
            }
            onBack={() => {
              setView("members");
              setSelectedMember(null);
              resetEntries();
            }}
            t={t}
          />
        )}
      </Popover.Panel>
    </Popover>
  );
});
