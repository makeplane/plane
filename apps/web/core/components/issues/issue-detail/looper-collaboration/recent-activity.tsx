import { Check, Circle, MessageCircle, RefreshCw } from "lucide-react";

import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

import { resolveRecentEvent } from "./delivery-overview-view";
import type { TLooperSummary } from "./types";

type Props = {
  events: NonNullable<TLooperSummary["recent_events"]>;
};

const eventIcon = (type: string) => {
  if (type === "role_request_answered" || type === "dispatch_completed") return Check;
  if (type.startsWith("role_")) return MessageCircle;
  if (type === "dispatch_running" || type === "dispatch_claimed") return RefreshCw;
  return Circle;
};

export function LooperRecentActivity({ events }: Props) {
  const { t } = useTranslation();
  if (events.length === 0) return null;

  return (
    <section>
      <div className="mb-2 text-caption-sm-regular text-tertiary">{t("issue.looper.activity.title")}</div>
      <ol className="ml-1.5 border-l border-subtle pl-4">
        {events.map((event) => {
          const Icon = eventIcon(event.type);
          const role = event.role ? t(`issue.looper.role.${event.role}`) : "";
          return (
            <li key={event.id} className="relative flex min-h-8 items-start gap-2 py-1.5">
              <span className="absolute top-2.5 -left-[23px] grid size-3.5 place-items-center rounded-full bg-surface-1 text-tertiary">
                <Icon className={cn("size-2.5", event.type === "dispatch_completed" && "text-success-primary")} />
              </span>
              <span className="min-w-0 grow text-body-xs-regular text-secondary">
                {t(resolveRecentEvent(event), {
                  role,
                  actor: event.actor?.display_name ?? t("issue.looper.activity.looper"),
                })}
              </span>
              <time className="shrink-0 text-caption-sm-regular text-tertiary" suppressHydrationWarning>
                {new Date(event.occurred_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </time>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
