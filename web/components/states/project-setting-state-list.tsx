"use client";

import React, { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// hooks
import { Plus } from "lucide-react";
import { Loader } from "@plane/ui";
import { CreateUpdateStateInline, DeleteStateModal, StateGroup, StatesListItem } from "@/components/states";
import { STATES_LIST } from "@/constants/fetch-keys";
import { sortByField } from "@/helpers/array.helper";
import { orderStateGroups } from "@/helpers/state.helper";
import { useEventTracker, useProjectState } from "@/hooks/store";
// components
// ui
// icons
// helpers
// fetch-keys

export const ProjectSettingStateList: React.FC = observer(() => {
  // router
  const { workspaceSlug, projectId } = useParams();
  // store
  const { setTrackElement } = useEventTracker();
  const { groupedProjectStates, projectStates, fetchProjectStates } = useProjectState();
  // state
  const [activeGroup, setActiveGroup] = useState<StateGroup>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectDeleteState, setSelectDeleteState] = useState<string | null>(null);

  useSWR(
    workspaceSlug && projectId ? STATES_LIST(projectId.toString()) : null,
    workspaceSlug && projectId ? () => fetchProjectStates(workspaceSlug.toString(), projectId.toString()) : null
  );

  // derived values
  const orderedStateGroups = orderStateGroups(groupedProjectStates!);

  return (
    <>
      <DeleteStateModal
        isOpen={!!selectDeleteState}
        onClose={() => setSelectDeleteState(null)}
        data={projectStates?.find((s) => s.id === selectDeleteState) ?? null}
      />

      <div className="space-y-8 py-6">
        {orderedStateGroups ? (
          <>
            {Object.keys(orderedStateGroups).map((group) => (
              <div key={group} className="flex flex-col gap-2">
                <div className="flex w-full justify-between">
                  <h4 className="text-base font-medium capitalize text-custom-text-200">{group}</h4>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-2 text-custom-primary-100 outline-none hover:text-custom-primary-200"
                    onClick={() => {
                      setTrackElement("PROJECT_SETTINGS_STATES_PAGE");
                      setActiveGroup(group as keyof StateGroup);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-col gap-2 rounded">
                  {group === activeGroup && (
                    <CreateUpdateStateInline
                      data={null}
                      groupLength={orderedStateGroups[group].length}
                      onClose={() => {
                        setActiveGroup(null);
                        setSelectedState(null);
                      }}
                      selectedGroup={group as keyof StateGroup}
                    />
                  )}
                  {sortByField(orderedStateGroups[group], "sequence").map((state, index) =>
                    state.id !== selectedState ? (
                      <StatesListItem
                        key={state.id}
                        index={index}
                        state={state}
                        statesList={projectStates ?? []}
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
                          groupLength={orderedStateGroups[group].length}
                          data={projectStates?.find((state) => state.id === selectedState) ?? null}
                          selectedGroup={group as keyof StateGroup}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </>
        ) : (
          <Loader className="space-y-5 md:w-2/3">
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
            <Loader.Item height="40px" />
          </Loader>
        )}
      </div>

      {/* <div className="space-y-8 py-6">
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
                        <StatesListItem
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
      </div> */}
    </>
  );
});
