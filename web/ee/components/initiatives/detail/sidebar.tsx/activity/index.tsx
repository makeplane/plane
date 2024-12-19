import { FC } from "react";
import { observer } from "mobx-react";
// Plane-web
import { TInitiativeActivity } from "@/plane-web/types/initiative";
//
import { InitiativeDefaultActivity } from "./default";
import { InitiativeDescriptionActivity } from "./description";
import { InitiativeLeadActivity } from "./lead";
import { InitiativeLinkActivity } from "./link";
import { InitiativeNameActivity } from "./name";
import { InitiativeStartDateActivity } from "./start_date";
import { InitiativeTargetDateActivity } from "./target_date";

type TInitiativeActivityItem = {
  activity: TInitiativeActivity;
  ends: "top" | "bottom" | undefined;
};

export const InitiativeActivityItem: FC<TInitiativeActivityItem> = observer((props) => {
  const { activity, ends } = props;

  const componentDefaultProps = { activity, ends };

  const activityField = activity?.field;

  switch (activityField) {
    case null: // default issue creation
      return <InitiativeDefaultActivity {...componentDefaultProps} />;
    case "name":
      return <InitiativeNameActivity {...componentDefaultProps} />;
    case "description":
      return <InitiativeDescriptionActivity {...componentDefaultProps} />;
    case "lead":
      return <InitiativeLeadActivity {...componentDefaultProps} />;
    case "start_date":
      return <InitiativeStartDateActivity {...componentDefaultProps} />;
    case "end_date":
      return <InitiativeTargetDateActivity {...componentDefaultProps} />;
    case "link":
      return <InitiativeLinkActivity {...componentDefaultProps} />;
    case "attachment":
      return <InitiativeNameActivity {...componentDefaultProps} />;
    default:
      return <></>;
  }
});
