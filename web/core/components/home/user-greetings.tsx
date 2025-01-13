import { FC } from "react";
// hooks
import { Shapes } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { IUser } from "@plane/types";
import { useCurrentTime } from "@/hooks/use-current-time";
// types

export interface IUserGreetingsView {
  user: IUser;
  handleWidgetModal: () => void;
}

export const UserGreetingsView: FC<IUserGreetingsView> = (props) => {
  const { user, handleWidgetModal } = props;
  // current time hook
  const { currentTime } = useCurrentTime();
  const { t } = useTranslation();

  const hour = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    hour: "numeric",
  }).format(currentTime);

  const weekDay = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(currentTime);

  const timeString = new Intl.DateTimeFormat("en-US", {
    timeZone: user?.user_timezone,
    hour12: false, // Use 24-hour format
    hour: "2-digit",
    minute: "2-digit",
  }).format(currentTime);

  const month = new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(currentTime);

  const dateNumber = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
  }).format(currentTime);

  const greeting = parseInt(hour, 10) < 12 ? t("morning") : parseInt(hour, 10) < 18 ? t("afternoon") : t("evening");

  return (
    <div className="flex justify-between">
      <div>
        <h3 className="text-xl font-semibold text-center">
          {t("good")} {greeting}, {user?.first_name} {user?.last_name}
        </h3>
        <h6 className="flex items-center gap-2 font-medium text-custom-text-400">
          <div>{greeting === "morning" ? "🌤️" : greeting === "afternoon" ? "🌥️" : "🌙️"}</div>
          <div>
            {t(weekDay)}, {t(month.toLowerCase())} {dateNumber} {timeString}
          </div>
        </h6>
      </div>
      <button
        onClick={handleWidgetModal}
        className="flex items-center gap-2 font-medium text-custom-text-300 justify-center border border-custom-border-200 rounded p-2 my-auto mb-0"
      >
        <Shapes size={16} />
        <div className="text-xs font-medium">{t("manage_widgets")}</div>
      </button>
    </div>
  );
};
