"use client";

import { Calendar, Clock, FileText, Mail, MapPin, Phone, User } from "lucide-react";
import { TagsSection } from "../components/tags-section";
import { formatMetaLabel, formatMetaValue, isMeaningfulValue } from "./media-detail-utils";

type TMediaDetailSidebarProps = {
  item: any;
  activeTab: "details" | "tags";
  setActiveTab: (tab: "details" | "tags") => void;
  eventDateLabel: string;
  eventTimeLabel: string;
  category: string;
  season: string;
  createdByLabel: string;
  sport: string;
  program: string;
  level: string;
  opposition: Record<string, unknown> | null;
  oppositionName: string;
  oppositionLogoUrl: string;
  oppositionHeadCoach: string;
  oppositionAsstCoach: string;
  oppositionAthleticEmail: string;
  oppositionAthleticPhone: string;
  oppositionAsstAthleticEmail: string;
  oppositionAsstAthleticPhone: string;
  oppositionAddress: string;
  hasOppositionDetails: boolean;
  fileTypeLabel: string;
  fileSizeLabel: string;
  source: string;
  kind: string;
  metaEntries: Array<[string, unknown]>;
  durationLabel: string;
  durationSecLabel: string;
  onPlay: () => void;
};

export const MediaDetailSidebar = ({
  item,
  activeTab,
  setActiveTab,
  eventDateLabel,
  eventTimeLabel,
  category,
  season,
  createdByLabel,
  sport,
  program,
  level,
  opposition,
  oppositionName,
  oppositionLogoUrl,
  oppositionHeadCoach,
  oppositionAsstCoach,
  oppositionAthleticEmail,
  oppositionAthleticPhone,
  oppositionAsstAthleticEmail,
  oppositionAsstAthleticPhone,
  oppositionAddress,
  hasOppositionDetails,
  fileTypeLabel,
  fileSizeLabel,
  source,
  kind,
  metaEntries,
  durationLabel,
  durationSecLabel,
  onPlay,
}: TMediaDetailSidebarProps) => (
  <div className="flex flex-col gap-4 rounded-2xl border border-custom-border-200 bg-custom-background-100 p-4">
    <div className="flex items-center gap-2 rounded-full border border-custom-border-200 bg-custom-background-90 p-1 text-[11px] text-custom-text-300">
      <button
        type="button"
        onClick={() => setActiveTab("details")}
        className={`rounded-full px-3 py-1 ${
          activeTab === "details"
            ? "border border-custom-border-200 bg-custom-background-100 text-custom-text-100"
            : "hover:text-custom-text-100"
        }`}
      >
        Details
      </button>
    </div>

    {activeTab === "details" ? (
      <div className="max-h-[550px] space-y-4 overflow-y-auto pr-2">
        <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
          <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
            Event details
          </div>
          <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
            {isMeaningfulValue(eventDateLabel) ? (
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                <span>{eventDateLabel}</span>
              </div>
            ) : null}
            {isMeaningfulValue(eventTimeLabel) ? (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>{eventTimeLabel}</span>
              </div>
            ) : null}
            {isMeaningfulValue(category) ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-custom-text-200">Category</span>
                <span className="text-right">{category}</span>
              </div>
            ) : null}
            {isMeaningfulValue(season) ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-custom-text-200">Season</span>
                <span className="text-right">{season}</span>
              </div>
            ) : null}
            {isMeaningfulValue(createdByLabel) ? (
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                <span>{createdByLabel}</span>
              </div>
            ) : null}
          </div>
        </div>

        {isMeaningfulValue(sport) || isMeaningfulValue(program) || isMeaningfulValue(level) ? (
          <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
            <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
              Team details
            </div>
            <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
              {isMeaningfulValue(sport) ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-custom-text-200">Sport</span>
                  <span className="text-right">{sport}</span>
                </div>
              ) : null}
              {isMeaningfulValue(program) ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-custom-text-200">Program</span>
                  <span className="text-right">{program}</span>
                </div>
              ) : null}
              {isMeaningfulValue(level) ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-custom-text-200">Level</span>
                  <span className="text-right">{level}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {opposition && hasOppositionDetails ? (
          <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
            <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
              Opposition
            </div>
            <div className="space-y-3 px-4 py-3 text-xs text-custom-text-300">
              {oppositionName || oppositionLogoUrl ? (
                <div className="flex items-center gap-3">
                  {oppositionLogoUrl ? (
                    <img
                      src={oppositionLogoUrl}
                      alt={oppositionName || "Opposition logo"}
                      className="h-10 w-10 rounded-full border border-custom-border-200 object-cover"
                    />
                  ) : null}
                  <div className="text-sm font-semibold text-custom-text-100">
                    {oppositionName || "Opposition team"}
                  </div>
                </div>
              ) : null}
              {oppositionHeadCoach ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-custom-text-200">Head coach</span>
                  <span className="text-right">{oppositionHeadCoach}</span>
                </div>
              ) : null}
              {oppositionAsstCoach ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-custom-text-200">Assistant coach</span>
                  <span className="text-right">{oppositionAsstCoach}</span>
                </div>
              ) : null}
              {oppositionAthleticEmail ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <a href={`mailto:${oppositionAthleticEmail}`} className="text-custom-text-200 hover:text-custom-text-100">
                    {oppositionAthleticEmail}
                  </a>
                </div>
              ) : null}
              {oppositionAthleticPhone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <a href={`tel:${oppositionAthleticPhone}`} className="text-custom-text-200 hover:text-custom-text-100">
                    {oppositionAthleticPhone}
                  </a>
                </div>
              ) : null}
              {oppositionAsstAthleticEmail ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  <a
                    href={`mailto:${oppositionAsstAthleticEmail}`}
                    className="text-custom-text-200 hover:text-custom-text-100"
                  >
                    {oppositionAsstAthleticEmail}
                  </a>
                </div>
              ) : null}
              {oppositionAsstAthleticPhone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  <a
                    href={`tel:${oppositionAsstAthleticPhone}`}
                    className="text-custom-text-200 hover:text-custom-text-100"
                  >
                    {oppositionAsstAthleticPhone}
                  </a>
                </div>
              ) : null}
              {oppositionAddress ? (
                <div className="flex items-start gap-2 text-custom-text-200">
                  <MapPin className="mt-0.5 h-3.5 w-3.5" />
                  <span className="leading-relaxed">{oppositionAddress}</span>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {item.mediaType === "video" ? (
          <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
            <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
              Duration &amp; sharing
            </div>
            <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
              <div className="flex items-center justify-between">
                <span>Duration</span>
                <span>{durationLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Duration (sec)</span>
                <span>{durationSecLabel}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shared with</span>
                <span>--</span>
              </div>
            </div>
          </div>
        ) : null}

        {item.docs.length > 0 ? (
          <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
            <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
              Documents
            </div>
            <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
              {item.docs.map((doc: string) => (
                <div key={doc} className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5" />
                  <span>{doc}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-custom-border-200 bg-custom-background-90">
          <div className="border-b border-custom-border-200 px-4 py-2 text-xs font-semibold text-custom-text-100">
            Media info
          </div>
          <div className="space-y-2 px-4 py-3 text-xs text-custom-text-300">
            {isMeaningfulValue(fileTypeLabel) ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-custom-text-200">File type</span>
                <span className="text-right">{formatMetaValue(fileTypeLabel)}</span>
              </div>
            ) : null}
            {isMeaningfulValue(fileSizeLabel) ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-custom-text-200">File size</span>
                <span className="text-right">{fileSizeLabel}</span>
              </div>
            ) : null}
            {isMeaningfulValue(source) ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-custom-text-200">Source</span>
                <span className="text-right">{source}</span>
              </div>
            ) : null}
            {isMeaningfulValue(kind) ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-custom-text-200">Kind</span>
                <span className="text-right">{kind}</span>
              </div>
            ) : null}
            {metaEntries.length < 0 ? (
              <div className="text-xs text-custom-text-400">No metadata available.</div>
            ) : (
              metaEntries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="truncate text-custom-text-200">{formatMetaLabel(key)}</span>
                  <span className="max-w-[55%] truncate text-right">{formatMetaValue(value)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    ) : (
      <TagsSection item={item} onPlay={onPlay} />
    )}
  </div>
);
