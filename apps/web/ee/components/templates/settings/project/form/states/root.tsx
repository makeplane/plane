import { useMemo } from "react";
import groupBy from "lodash/groupBy";
import orderBy from "lodash/orderBy";
import { observer } from "mobx-react";
import { useFormContext } from "react-hook-form";
// plane imports
import { STATE_GROUPS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { IState, TProjectTemplateForm, TStateOperationsCallbacks } from "@plane/types";
import { mockCreateOrUpdateState } from "@plane/utils";
// components
import { GroupList } from "@/components/project-states";
// plane web imports
import { TemplateCollapsibleWrapper } from "@/plane-web/components/templates/settings/common";

type TProjectStatesProps = {
  workspaceSlug: string;
  projectId: string;
};

export const ProjectStates = observer((props: TProjectStatesProps) => {
  const { workspaceSlug, projectId } = props;
  // plane hooks
  const { t } = useTranslation();
  // form context
  const { watch, setValue } = useFormContext<TProjectTemplateForm>();
  // derived values
  const projectStates = watch("project.states");
  const groupedProjectStates: Record<string, IState[]> = useMemo(() => {
    // Group all the existing states by group key, ordered by sequence number
    const groupedStates = groupBy(orderBy(projectStates, "sequence", "asc"), "group") as Record<string, IState[]>;
    // Ensure all STATE_GROUPS are present
    return Object.keys(STATE_GROUPS).reduce(
      (acc, group) => ({
        ...acc,
        [group]: groupedStates[group] || [],
      }),
      {} as Record<string, IState[]>
    );
  }, [projectStates]);

  // state operations callbacks
  const stateOperationsCallbacks: TStateOperationsCallbacks = useMemo(
    () => ({
      // Create a new state with the highest sequence number for the group
      createState: async (data: Partial<IState>) =>
        mockCreateOrUpdateState({ workspaceSlug, projectId, data }).then((state) => {
          // get the highest sequence number for the group, default to 0 if no states in the group
          const groupStatesSequenceNumbers = projectStates
            .filter((s) => s.group === state.group)
            .map((s) => s.sequence);
          const highestSequenceNumber =
            groupStatesSequenceNumbers.length > 0 ? Math.max(...groupStatesSequenceNumbers) : 0;
          // ensure the next sequence number is not greater than 65535
          const nextSequenceNumber = Math.min(highestSequenceNumber + 1000, 65535);
          // update the state with the highest sequence number
          setValue("project.states", [...projectStates, { ...state, sequence: nextSequenceNumber }], {
            shouldDirty: true,
          });
          return state;
        }),
      // Update an existing state
      updateState: async (stateId: string, data: Partial<IState>) =>
        mockCreateOrUpdateState({ workspaceSlug, projectId, data: { ...data, id: stateId } }).then((state) => {
          setValue(
            "project.states",
            projectStates.map((s) => (s.id === stateId ? { ...s, ...state } : s)),
            {
              shouldDirty: true,
            }
          );
          return state;
        }),
      // Delete a state
      deleteState: async (stateId: string) =>
        setValue(
          "project.states",
          projectStates.filter((s) => s.id !== stateId),
          {
            shouldDirty: true,
          }
        ),
      // Move a state to a new position
      moveStatePosition: async (stateId: string, data: Partial<IState>) => {
        setValue(
          "project.states",
          projectStates.map((s) => (s.id === stateId ? { ...s, ...data } : s)),
          {
            shouldDirty: true,
          }
        );
      },
      // Mark a state as default
      markStateAsDefault: async (stateId: string) => {
        setValue(
          "project.states",
          projectStates.map((state) => ({
            ...state,
            default: state.id === stateId,
          })),
          {
            shouldDirty: true,
          }
        );
      },
    }),
    [workspaceSlug, projectId, projectStates, setValue]
  );

  return (
    <TemplateCollapsibleWrapper title={t("common.states")}>
      <div className="py-3">
        <GroupList
          groupedStates={groupedProjectStates}
          stateOperationsCallbacks={stateOperationsCallbacks}
          shouldTrackEvents={false}
          isEditable
          groupListClassName="space-y-4"
          groupItemClassName="bg-custom-background-100 border-custom-border-100 rounded-lg"
          stateItemClassName="border-custom-border-200"
        />
      </div>
    </TemplateCollapsibleWrapper>
  );
});
