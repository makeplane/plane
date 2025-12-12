import { useState, useEffect } from "react";
import { CloudOff } from "lucide-react";
import { Tooltip } from "@plane/ui";

type Props = {
  syncStatus: "syncing" | "synced" | "error";
};

export function PageSyncingBadge({ syncStatus }: Props) {
  const [prevSyncStatus, setPrevSyncStatus] = useState<"syncing" | "synced" | "error" | null>(null);
  const [isVisible, setIsVisible] = useState(syncStatus !== "synced");

  useEffect(() => {
    // Only handle transitions when there's a change
    if (prevSyncStatus !== syncStatus) {
      if (syncStatus === "synced") {
        // Delay hiding to allow exit animation to complete
        setTimeout(() => {
          setIsVisible(false);
        }, 300); // match animation duration
      } else {
        setIsVisible(true);
      }
      setPrevSyncStatus(syncStatus);
    }
  }, [syncStatus, prevSyncStatus]);

  if (!isVisible || syncStatus === "synced") return null;

  const badgeContent = {
    syncing: {
      label: "Syncing...",
      tooltipHeading: "Syncing...",
      tooltipContent: "Your changes are being synced with the server. You can continue making changes.",
      bgColor: "bg-accent-primary/20",
      textColor: "text-accent-primary",
      pulseColor: "bg-accent-primary",
      pulseBgColor: "bg-accent-primary/30",
      icon: null,
    },
    error: {
      label: "Connection lost",
      tooltipHeading: "Connection lost",
      tooltipContent:
        "We're having trouble connecting to the websocket server. Your changes will be synced and saved every 10 seconds.",
      bgColor: "bg-danger-subtle",
      textColor: "text-red-500",
      icon: <CloudOff className="size-3" />,
    },
  };

  // This way we guarantee badgeContent is defined
  const content = badgeContent[syncStatus];

  return (
    <Tooltip tooltipHeading={content.tooltipHeading} tooltipContent={content.tooltipContent}>
      <div
        className={`shrink-0 h-7 flex items-center gap-1.5 px-2 rounded-md ${content.textColor} ${content.bgColor} animate-quickFadeIn`}
      >
        {syncStatus === "syncing" ? (
          <div className="relative shrink-0">
            <div className="absolute -inset-0.5 rounded-full bg-accent-primary/30 animate-ping" />
            <div className="relative h-1.5 w-1.5 rounded-full bg-accent-primary" />
          </div>
        ) : (
          content.icon
        )}
        <span className="text-11 font-medium">{content.label}</span>
      </div>
    </Tooltip>
  );
}
