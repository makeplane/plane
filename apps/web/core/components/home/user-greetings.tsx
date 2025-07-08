import { FC } from "react";
import { Shapes } from "lucide-react";
// plane types
import { useTranslation } from "@plane/i18n";
import { IUser } from "@plane/types";
// plane ui
import { Button } from "@plane/ui";
// hooks
import { useCurrentTime } from "@/hooks/use-current-time";

export interface IUserGreetingsView {
  user: IUser;
  handleWidgetModal: () => void;
}

export const UserGreetingsView: FC<IUserGreetingsView> = (props) => {
  const { user, handleWidgetModal } = props;
  // current time hook
  const { currentTime } = useCurrentTime();
  // store hooks
  const { t } = useTranslation();

  const hour = new Intl.DateTimeFormat("en-US", {
    hour12: false,
    hour: "numeric",
  }).format(currentTime);

  const date = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
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

  const greeting = parseInt(hour, 10) < 12 ? "morning" : parseInt(hour, 10) < 18 ? "afternoon" : "evening";

  return (
    <div className="flex justify-between">
      <div>
        <h3 className="text-xl font-semibold text-center">
          {t("good")} {t(greeting)}, {user?.first_name} {user?.last_name}
        </h3>
        <h6 className="flex items-center gap-2 font-medium text-custom-text-400">
          <div>{greeting === "morning" ? "🌤️" : greeting === "afternoon" ? "🌥️" : "🌙️"}</div>
          <div>
            {weekDay}, {date} {timeString}
          </div>
        </h6>
      </div>
      <Button variant="neutral-primary" size="sm" onClick={handleWidgetModal} className="my-auto mb-0">
        <Shapes size={16} />
        <div className="text-xs font-medium">{t("home.manage_widgets")}</div>
      </Button>
    </div>
  );
};
