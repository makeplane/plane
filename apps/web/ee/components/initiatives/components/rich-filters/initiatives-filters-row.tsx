import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { CalendarCheck2, CalendarClock, Users } from "lucide-react";
import { FilterInstance } from "@plane/shared-state";
import { COLLECTION_OPERATOR, IUserLite } from "@plane/types";
import { Avatar, Loader } from "@plane/ui";
import {
  createFilterConfig,
  getStartDateFilterConfig,
  getTargetDateFilterConfig,
  createOperatorConfigEntry,
  getMemberMultiSelectConfig,
} from "@plane/utils";
import { FiltersRow } from "@/components/rich-filters/filters-row";
import { useMember } from "@/hooks/store/use-member";
import { useFiltersOperatorConfigs } from "@/plane-web/hooks/rich-filters/use-filters-operator-configs";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";
import { TExternalInitiativeFilterExpression, TInitiativeFilterKeys } from "@/plane-web/types/initiative";
import { InitiativesFilterAdapter } from "./initiatives-filter-adapter";

const createFilterInstance = (
  filters: TExternalInitiativeFilterExpression,
  onExpressionChange: (expression: TExternalInitiativeFilterExpression) => void
) =>
  new FilterInstance<TInitiativeFilterKeys, TExternalInitiativeFilterExpression>({
    adapter: new InitiativesFilterAdapter(),
    initialExpression: filters,
    onExpressionChange: (expression) => {
      onExpressionChange(expression);
    },
  });

const InitiativesFilterRowContent = observer(
  ({
    filters,
    updateFilters,
    workspaceSlug,
  }: {
    filters: TExternalInitiativeFilterExpression;
    updateFilters: (workspaceSlug: string, filters: TExternalInitiativeFilterExpression) => void;
    workspaceSlug: string;
  }) => {
    const [filterInstance] = useState(() =>
      createFilterInstance(filters, (expression) => {
        updateFilters(workspaceSlug, expression);
      })
    );
    const operatorConfigs = useFiltersOperatorConfigs({ workspaceSlug: workspaceSlug?.toString() });
    const {
      workspace: { workspaceMemberIds },
      getUserDetails,
    } = useMember();

    const workspaceMembers = useMemo(() => {
      if (!workspaceMemberIds) return [];
      return workspaceMemberIds.map((memberId) => getUserDetails(memberId)).filter(Boolean) as IUserLite[];
    }, [getUserDetails, workspaceMemberIds]);

    const leadFilterConfig = useMemo(
      () =>
        createFilterConfig<TInitiativeFilterKeys, string>({
          id: "lead",
          label: "Lead",
          icon: Users,
          isEnabled: true,
          supportedOperatorConfigsMap: new Map([
            createOperatorConfigEntry(
              COLLECTION_OPERATOR.IN,
              {
                isEnabled: true,
                members: workspaceMembers,
                getOptionIcon: (member: IUserLite) => (
                  <Avatar src={member.avatar_url} name={member.display_name} size="sm" />
                ),
                ...operatorConfigs,
              },
              (updatedParams) => getMemberMultiSelectConfig(updatedParams)
            ),
          ]),
          ...operatorConfigs,
        }),
      [workspaceMembers, operatorConfigs]
    );

    const startDateFilterConfig = useMemo(
      () =>
        getStartDateFilterConfig<TInitiativeFilterKeys>("start_date")({
          isEnabled: true,
          filterIcon: CalendarClock,
          ...operatorConfigs,
        }),
      [operatorConfigs]
    );

    const endDateFilterConfig = useMemo(
      () =>
        getTargetDateFilterConfig<TInitiativeFilterKeys>("end_date")({
          isEnabled: true,
          filterIcon: CalendarCheck2,
          ...operatorConfigs,
        }),
      [operatorConfigs]
    );

    filterInstance.configManager.registerAll([leadFilterConfig, startDateFilterConfig, endDateFilterConfig]);

    if (!workspaceMembers) {
      return <Loader.Item height="24px" width="100%" />;
    }

    return (
      <FiltersRow
        filter={filterInstance}
        buttonConfig={{
          variant: "neutral-primary",
        }}
      />
    );
  }
);

const InitiativesFiltersRow = observer(() => {
  const { workspaceSlug } = useParams();
  const {
    initiativeFilters: { updateFilters, getInitiativeFilters },
  } = useInitiatives();
  const filters = getInitiativeFilters(workspaceSlug?.toString());

  if (!workspaceSlug) return null;

  return (
    <>
      {filters ? (
        <InitiativesFilterRowContent
          filters={filters}
          updateFilters={updateFilters}
          workspaceSlug={workspaceSlug.toString()}
        />
      ) : (
        <div className="px-page-x @container flex flex-wrap justify-between py-2 border-b border-custom-border-200 gap-2 bg-custom-background-100 z-[12]">
          <Loader.Item height="24px" width="100%" />
        </div>
      )}
    </>
  );
});

export default InitiativesFiltersRow;
