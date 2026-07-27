import type { LucideIcon } from "lucide-react";
import { CalendarX2, CircleAlert, SearchX, Tags } from "lucide-react";
import { cn } from "@plane/utils";

export type MatrixStateKind = "empty-event" | "error" | "no-filter-results" | "no-tags" | "unsupported-sport";

type MatrixEmptyStateProps = {
  className?: string;
  description?: string;
  kind: MatrixStateKind;
  title?: string;
};

const STATE_CONTENT: Record<MatrixStateKind, { description: string; icon: LucideIcon; title: string }> = {
  "empty-event": {
    description: "Select an event with completed tag data to view its matrix.",
    icon: CalendarX2,
    title: "No event selected",
  },
  error: {
    description: "The event tags could not be loaded. Try refreshing the event.",
    icon: CircleAlert,
    title: "Unable to load matrix",
  },
  "no-filter-results": {
    description: "No tags match the current matrix filters.",
    icon: SearchX,
    title: "No matching tags",
  },
  "no-tags": {
    description: "No tags were returned for this event, so the matrix cannot be built.",
    icon: Tags,
    title: "No tags available",
  },
  "unsupported-sport": {
    description: "Matrix View is not configured for this event's sport.",
    icon: CircleAlert,
    title: "Sport not supported",
  },
};

export const MatrixEmptyState = ({ className, description, kind, title }: MatrixEmptyStateProps) => {
  const state = STATE_CONTENT[kind];
  const Icon = state.icon;
  const isError = kind === "error";

  return (
    <div
      aria-live={isError ? "assertive" : "polite"}
      className={cn(
        "flex min-h-52 w-full flex-col items-center justify-center gap-3 px-6 py-10 text-center",
        className
      )}
      role={isError ? "alert" : "status"}
    >
      <div
        className={cn(
          "grid h-9 w-9 place-items-center rounded-md border border-custom-border-200 bg-custom-background-90 text-custom-text-300",
          isError && "border-red-500/30 bg-red-500/10 text-red-400"
        )}
      >
        <Icon aria-hidden="true" className="h-4 w-4" />
      </div>
      <div className="max-w-md">
        <h3 className="text-sm font-medium text-custom-text-100">{title ?? state.title}</h3>
        <p className="mt-1 text-xs leading-5 text-custom-text-300">{description ?? state.description}</p>
      </div>
    </div>
  );
};
