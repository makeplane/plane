// hooks
import { useCurrentTime } from "hooks/use-current-time";

type Props = {
  timeZone: string | undefined;
};

export const ProfileSidebarTime: React.FC<Props> = (props) => {
  const { timeZone } = props;
  // current time hook
  const { currentTime } = useCurrentTime();

  // Create a date object for the current time in the specified timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    hour12: false, // Use 24-hour format
    hour: "2-digit",
    minute: "2-digit",
  });
  const timeString = formatter.format(currentTime);

  return (
    <span>
      {timeString} <span className="text-custom-text-200">{timeZone}</span>
    </span>
  );
};
