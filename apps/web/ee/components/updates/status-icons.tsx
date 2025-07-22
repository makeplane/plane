import { EUpdateStatus } from "@plane/types";
import { AtRiskIcon, OffTrackIcon, OnTrackIcon } from "@plane/ui";
import { capitalizeFirstLetter, cn, generateIconColors } from "@plane/utils";

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
  showText?: boolean;
  className?: string;
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

export const UpdateStatusIcons = ({
  statusType,
  showBackground = true,
  size = "sm",
  showText = false,
  className = "",
}: TUpdateStatusIcons) => {
  const status = statusType ? StatusOptions[statusType] : null;
  const color = status?.color ? generateIconColors(status?.color) : null;
  const iconColor = color ? color.foreground : "transparent";
  const backgroundColor = color ? color.background : "transparent";

  if (!showBackground && !status) return null;

  return (
    <>
      {showBackground ? (
        <div
          style={{
            backgroundColor: backgroundColor,
          }}
          className={cn(
            sizes[size].container,
            "flex-shrink-0 place-items-center rounded-full bg-custom-background-80 flex gap-1 p-1 justify-center",
            className,
            {
              "border border-dashed border-custom-border-300": !status,
              "px-2 w-auto": showText,
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
              className="flex-shrink-0"
            />
          )}
          {showText && (
            <span className="text-xs font-semibold" style={{ color: iconColor }}>
              {statusType && capitalizeFirstLetter(statusType.replaceAll("-", " ").toLowerCase())}
            </span>
          )}
        </div>
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
