import { useState } from "react";
import { observer } from "mobx-react";
// Plane
import { useTranslation } from "@plane/i18n";
import { Row } from "@plane/ui";
import { cn } from "@plane/utils";
// Plane-web
import { TInitiativeGroupByOptions } from "@/plane-web/types/initiative";
//
import { TInitiativeGroup } from "../utils";
import { GroupHeader } from "./group-header";
import { InitiativeBlock } from "./initiative-block";

type Props = {
  group: TInitiativeGroup;
  initiativesIds: string[];
  groupBy: TInitiativeGroupByOptions;
};

export const InitiativeGroup = observer((props: Props) => {
  const { group, initiativesIds, groupBy } = props;

  const [isExpanded, setIsExpanded] = useState(true);

  const { t } = useTranslation();

  const toggleListGroup = () => {
    setIsExpanded((prevState) => !prevState);
  };

  const shouldExpand = isExpanded || !groupBy;

  return (
    <div className={cn(`relative flex flex-shrink-0 flex-col border-[1px] border-transparent`)}>
      <Row className="sticky top-0 z-[2] w-full flex-shrink-0 border-b border-custom-border-200 bg-custom-background-90 py-1">
        <GroupHeader
          groupID={group.id}
          icon={group.icon}
          title={group.name === "All Initiatives" ? t("initiatives.all_initiatives") : group.name || ""}
          count={initiativesIds.length}
          toggleListGroup={toggleListGroup}
        />
      </Row>
      {shouldExpand && (
        <div className="relative">
          {initiativesIds &&
            initiativesIds.map((initiativeId) => <InitiativeBlock key={initiativeId} initiativeId={initiativeId} />)}
        </div>
      )}
    </div>
  );
});
