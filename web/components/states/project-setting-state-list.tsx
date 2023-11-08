import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// components
import { CreateUpdateStateInline, DeleteStateModal, ProjectSettingListItem, StateGroup } from "components/states";
// ui
import { Loader } from "@plane/ui";
// icons
import { Plus } from "lucide-react";
// helpers
import { getStatesList, orderStateGroups } from "helpers/state.helper";
// fetch-keys
import { STATES_LIST } from "constants/fetch-keys";

export const ProjectSettingStateList: React.FC = observer(() => {
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store
  const { project: projectStore } = useMobxStore();
  const { currentProjectDetails } = projectStore;
  // state
  const [activeGroup, setActiveGroup] = useState<StateGroup>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectDeleteState, setSelectDeleteState] = useState<string | null>(null);

  useSWR(
    workspaceSlug && projectId ? "PROJECT_DETAILS" : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectDetails(workspaceSlug.toString(), projectId.toString())
      : null
  );

  useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId.toString()) : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectStates(workspaceSlug.toString(), projectId.toString())
      : null
  );

  // derived values
  const states = projectStore.projectStatesByGroups;
  const orderedStateGroups = orderStateGroups(states!);
  const statesList = getStatesList(orderedStateGroups);

  return (
    <>
      <DeleteStateModal
        isOpen={!!selectDeleteState}
        onClose={() => setSelectDeleteState(null)}
        data={statesList?.find((s) => s.id === selectDeleteState) ?? null}
      />

      <div className="space-y-8 py-6">
        {states && currentProjectDetails && orderedStateGroups ? (
          Object.keys(orderedStateGroups || {}).map((key) => {
            if (orderedStateGroups[key].length !== 0)
              return (
                <div key={key} className="flex flex-col gap-2">
                  <div className="flex w-full justify-between">
                    <h4 className="text-base font-medium text-custom-text-200 capitalize">{key}</h4>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-custom-primary-100 px-2 hover:text-custom-primary-200 outline-none"
                      onClick={() => setActiveGroup(key as keyof StateGroup)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-2 rounded">
                    {key === activeGroup && (
                      <CreateUpdateStateInline
                        data={null}
                        groupLength={orderedStateGroups[key].length}
                        onClose={() => {
                          setActiveGroup(null);
                          setSelectedState(null);
                        }}
                        selectedGroup={key as keyof StateGroup}
                      />
                    )}
                    {orderedStateGroups[key].map((state, index) =>
                      state.id !== selectedState ? (
                        <ProjectSettingListItem
                          key={state.id}
                          index={index}
                          state={state}
                          statesList={statesList ?? []}
                          handleEditState={() => setSelectedState(state.id)}
                          handleDeleteState={() => setSelectDeleteState(state.id)}
                        />
                      ) : (
                        <div className="border-b-[0.5px] border-custom-border-200 last:border-b-0" key={state.id}>
                          <CreateUpdateStateInline
                            onClose={() => {
                              setActiveGroup(null);
                              setSelectedState(null);
                            }}
                            groupLength={orderedStateGroups[key].length}
                            data={statesList?.find((state) => state.id === selectedState) ?? null}
                            selectedGroup={key as keyof StateGroup}
                          />
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
          })
        ) : (
          <Loader className="space-y-5 md:w-2/3">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        )}
      </div>
    </>
  );
});
