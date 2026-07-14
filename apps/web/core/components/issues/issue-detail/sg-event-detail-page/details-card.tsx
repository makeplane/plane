import { CalendarDays, MapPin, Trophy } from "lucide-react";
import { cn } from "@plane/utils";
import { SURFACE_CLASS } from "./constants";

type SgEventDetailsCardProps = {
  eventDateTimeLabel: string;
  levelLabel: string;
  venueAddress: string;
  venueName: string;
};

export const SgEventDetailsCard = ({
  eventDateTimeLabel,
  levelLabel,
  venueAddress,
  venueName,
}: SgEventDetailsCardProps) => (
  <section className={cn(SURFACE_CLASS, "overflow-hidden")}>
    <div className="border-b border-custom-border-200 px-4 py-3 text-sm font-semibold text-custom-text-100">
      Event details
    </div>
    <div className="grid gap-4 px-4 py-3.5 md:grid-cols-[minmax(180px,0.9fr)_minmax(260px,1.3fr)_minmax(120px,0.55fr)]">
      <div className="flex items-start gap-3 text-sm">
        <CalendarDays className="mt-0.5 h-4 w-4 text-custom-text-400" />
        <div className="min-w-0">
          <div className="text-custom-text-300">{eventDateTimeLabel}</div>
        </div>
      </div>
      <div className="flex items-start gap-3 text-sm">
        <MapPin className="mt-0.5 h-4 w-4 text-custom-text-400" />
        <div className="min-w-0 text-custom-text-300">
          <div className="truncate text-custom-text-300" title={[venueName, venueAddress].filter(Boolean).join(", ")}>
            {[venueName, venueAddress].filter(Boolean).join(", ") || "Venue unavailable"}
          </div>
        </div>
      </div>
      <div className="flex items-start gap-3 text-sm">
        <Trophy className="mt-0.5 h-4 w-4 text-custom-text-400" />
        <div className="text-custom-text-300">{levelLabel}</div>
      </div>
    </div>
  </section>
);
