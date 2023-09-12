import React from "react";
// react beautiful dnd
import { DragDropContext, Droppable } from "react-beautiful-dnd";
// components
import { IssueHeader } from "./header";
import { IssueContent } from "./content";
// mobx
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const IssueKanBanViewRoot = observer(() => {
  const store: RootStore = useMobxStore();
  const { issueFilters: issueFilterStore, issueView: issueViewStore } = store;

  const onDragEnd = (result: any) => {
    if (!result) return;

    if (
      result.destination &&
      result.source &&
      result.destination.droppableId === result.source.droppableId &&
      result.destination.index === result.source.index
    )
      return;

    console.log("result", result);
  };

  console.log("------");
  console.log("workspace id -->", issueFilterStore?.workspaceId);
  console.log("project id -->", issueFilterStore?.projectId);
  console.log("module id -->", issueFilterStore?.moduleId);
  console.log("cycle id -->", issueFilterStore?.cycleId);
  console.log("view id -->", issueFilterStore?.viewId);

  console.log("<-- workspace level -->");
  console.log("workspace projects -->", issueFilterStore?.workspaceProjects);
  console.log("workspace labels -->", issueFilterStore?.workspaceLabels);

  console.log("<-- project level -->");
  console.log("project states -->", issueFilterStore?.projectStates);
  console.log("project labels -->", issueFilterStore?.projectLabels);
  console.log("project members -->", issueFilterStore?.projectMembers);

  console.log("project display properties -->", issueFilterStore?.projectDisplayProperties);

  console.log("issue layout -->", issueFilterStore?.issueLayout);
  console.log("issues -->", issueViewStore?.getIssues);
  console.log("------");

  return (
    <div className="relative w-full h-full">
      {issueViewStore.loader || issueViewStore?.getIssues === null ? (
        <div>Loading...</div>
      ) : (
        <>
          {issueViewStore?.getIssues && Object.keys(issueViewStore?.getIssues).length > 0 ? (
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="relative w-full h-full overflow-hidden !overflow-x-scroll flex">
                {Object.keys(issueViewStore?.getIssues).map((_issueStateKey: any) => (
                  <div
                    key={`${_issueStateKey}`}
                    className="flex-shrink-0 w-[380px] h-full relative flex flex-col"
                  >
                    <div className="flex-shrink-0 w-full p-2">
                      <IssueHeader />
                    </div>

                    <Droppable droppableId={`${_issueStateKey}`}>
                      {(provided: any, snapshot: any) => (
                        <div
                          className={`w-full h-full relative transition-all py-1.5 overflow-hidden overflow-y-auto ${
                            snapshot.isDraggingOver ? `bg-orange-50` : `bg-gray-50`
                          }`}
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                        >
                          {issueViewStore?.getIssues && (
                            <IssueContent
                              columnId={_issueStateKey}
                              issues={issueViewStore?.getIssues[_issueStateKey]}
                            />
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </DragDropContext>
          ) : (
            <div>No Issues are available</div>
          )}
        </>
      )}
    </div>
  );
});
