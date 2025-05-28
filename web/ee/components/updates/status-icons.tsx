import { EUpdateStatus } from "@plane/types/src/enums";
import { OffTrackIcon, AtRiskIcon, OnTrackIcon } from "@plane/ui";
import { cn } from "@plane/utils";
import { generateIconColors } from "@/helpers/color.helper";

export const StatusOptions = {
  [EUpdateStatus.ON_TRACK]: {
    icon: OnTrackIcon,
    color: "#1FAD40",
  },

  [EUpdateStatus.AT_RISK]: {
    icon: AtRiskIcon,
    color: "#CC7700",
  },
  [EUpdateStatus.OFF_TRACK]: {
    icon: OffTrackIcon,
    color: "#CC0000",
  },
};

type TUpdateStatusIcons = {
  statusType?: EUpdateStatus;
  showBackground?: boolean;
  size?: "sm" | "md";
};

const sizes = {
  sm: {
    icon: 16,
    container: "w-6 h-6",
  },
  md: {
    icon: 20,
    container: "w-8 h-8",
  },
};

export const UpdateStatusIcons = ({ statusType, showBackground = true, size = "sm" }: TUpdateStatusIcons) => {
  const status = statusType ? StatusOptions[statusType] : null;
  const color = status?.color ? generateIconColors(status?.color) : null;
  const iconColor = color ? color.foreground : "transparent";
  const backgroundColor = color ? color.background : "transparent";

  if (!showBackground && !status) return null;

  return (
    <>
      {showBackground ? (
        <span
          style={{
            backgroundColor: backgroundColor,
          }}
          className={cn(
            sizes[size].container,
            "flex-shrink-0 grid place-items-center rounded-full bg-custom-background-80",
            {
              "border border-dashed border-custom-border-300": !status,
            }
          )}
        >
          {status && (
            <status.icon
              width={sizes[size].icon}
              height={sizes[size].icon}
              style={{
                color: iconColor ?? "#ffffff", // fallback color
              }}
            />
          )}
        </span>
      ) : (
        status && (
          <status.icon
            width={sizes[size].icon}
            height={sizes[size].icon}
            style={{
              color: iconColor ?? "#ffffff", // fallback color
            }}
          />
        )
      )}
    </>
  );
};
