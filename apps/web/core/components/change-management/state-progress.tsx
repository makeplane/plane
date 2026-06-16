import type { TChangeState, TChangeType } from "@/services/change-management.service";
import { Check, X, ChevronRight, SkipForward } from "lucide-react";

type Props = {
  state: TChangeState;
  type: TChangeType;
};

/**
 * The FULL lifecycle — always 8 states visible so Normal vs Standard
 * differences are unmistakable.
 */
const ALL_STATES: TChangeState[] = [
  "new", "assess", "authorize", "scheduled", "implement", "review", "closed",
];

const SKIPPED_FOR_STANDARD = new Set<TChangeState>(["assess", "authorize"]);

const STATE_LABELS: Record<TChangeState, string> = {
  new: "New",
  assess: "Assess",
  authorize: "Authorize",
  scheduled: "Scheduled",
  implement: "Implement",
  review: "Review",
  closed: "Closed",
  cancelled: "Cancelled",
};

const STATE_DESCRIPTIONS: Record<TChangeState, string> = {
  new: "Draft / intake",
  assess: "Peer review",
  authorize: "CAB approval",
  scheduled: "Ready to deploy",
  implement: "In progress",
  review: "Post-implementation",
  closed: "Complete",
  cancelled: "Terminated",
};

/**
 * Get the index of a state in the full lifecycle. For Standard changes,
 * we collapse skipped states so the "cursor" still moves correctly.
 */
function getPositionIndex(state: TChangeState, type: TChangeType): number {
  if (state === "cancelled") return -1;

  if (type === "standard") {
    // Standard effective order: new(0) → scheduled(3) → implement(4) → review(5) → closed(6)
    const idx = ALL_STATES.indexOf(state);
    return idx;
  }
  return ALL_STATES.indexOf(state);
}

export const StateProgress = ({ state, type }: Props) => {
  const currentIndex = getPositionIndex(state, type);
  const isStandard = type === "standard";
  const isCancelled = state === "cancelled";

  return (
    <div className="w-full mb-4">
      {/* Type indicator bar */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
            isStandard
              ? "bg-purple-500/15 text-purple-600 border border-purple-500/25"
              : "bg-blue-500/15 text-blue-600 border border-blue-500/25"
          }`}>
            {isStandard ? "Standard Change" : "Normal Change"}
          </span>
          {isStandard && (
            <span className="text-xs text-tertiary italic">
              Low risk — Assess &amp; Authorize skipped
            </span>
          )}
          {!isStandard && (
            <span className="text-xs text-tertiary italic">
              Requires peer review &amp; CAB approval
            </span>
          )}
        </div>

        {isCancelled && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-red-500/15 text-red-600 border border-red-500/25">
            <X className="w-3.5 h-3.5" />
            Cancelled
          </span>
        )}
      </div>

      {/* Cancelled overlay banner */}
      {isCancelled && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-3">
          <X className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-red-500 uppercase tracking-wide">
            This change request has been cancelled
          </span>
        </div>
      )}

      {/* State progression bar */}
      <div className="flex items-stretch w-full rounded-lg overflow-hidden border border-subtle">
        {ALL_STATES.map((s, index) => {
          const isSkipped = isStandard && SKIPPED_FOR_STANDARD.has(s);
          const isCompleted = !isCancelled && (state === "closed" || index < currentIndex);
          const isCurrent = !isCancelled && index === currentIndex;
          const isFuture = !isCancelled && !isCompleted && !isCurrent;
          const isLast = index === ALL_STATES.length - 1;

          // Styling
          let bgClass = "bg-layer-1";
          let textClass = "text-tertiary";
          let borderClass = "";

          if (isSkipped) {
            bgClass = "bg-layer-1";
            textClass = "text-placeholder line-through";
          } else if (isCancelled) {
            bgClass = "bg-layer-1";
            textClass = "text-placeholder";
          } else if (isCompleted) {
            bgClass = "bg-green-500/15";
            textClass = "text-green-700";
          } else if (isCurrent) {
            bgClass = "bg-blue-600/20";
            textClass = "text-blue-600";
            borderClass = "ring-2 ring-inset ring-blue-600/40";
          }

          return (
            <div
              key={s}
              className={`
                flex-1 flex flex-col items-center justify-center relative
                py-2.5 px-1 transition-all duration-200
                ${bgClass} ${borderClass}
                ${!isLast ? "border-r border-subtle" : ""}
              `}
            >
              {/* Status icon */}
              <div className="flex items-center justify-center mb-1">
                {isSkipped ? (
                  <SkipForward className="w-3.5 h-3.5 text-placeholder" />
                ) : isCompleted ? (
                  <Check className="w-4 h-4 text-green-600" />
                ) : isCurrent ? (
                  <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
                ) : (
                  <div className="w-2.5 h-2.5 rounded-full bg-layer-1 border border-subtle" />
                )}
              </div>

              {/* Label */}
              <span className={`text-[10px] font-bold uppercase tracking-wider leading-tight text-center ${textClass}`}>
                {STATE_LABELS[s]}
              </span>

              {/* Sub-description on hover / always for current */}
              {isCurrent && (
                <span className="text-[9px] text-blue-600/80 mt-0.5 text-center leading-tight">
                  {STATE_DESCRIPTIONS[s]}
                </span>
              )}
              {isSkipped && (
                <span className="text-[9px] text-placeholder mt-0.5 italic">
                  Skipped
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
