import React from "react";
// react beautiful dnd
import { DragDropContext, Droppable } from "react-beautiful-dnd";
// components
import { IssueHeader } from "./header";
import { IssueContent } from "./content";
import { IssueFooter } from "./footer";
// mobx
import { observer } from "mobx-react-lite";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

export const IssueRoot = observer(() => {
  const store: RootStore = useMobxStore();
  const { kanban: issueViewStore } = store;

  const onDragEnd = (result: any) => {
    console.log("result", result);
  };

  return (
    <div className="relative w-screen h-screen">
      {issueViewStore.loader && issueViewStore?.issues === null ? (
        <div>Loading...</div>
      ) : (
        <div className="relative w-full h-full p-2">
          {issueViewStore?.getIssues && Object.keys(issueViewStore?.getIssues).length > 0 ? (
            <div className="relative overflow-hidden overflow-x-auto w-full h-full flex">
              <DragDropContext onDragEnd={onDragEnd}>
                {Object.keys(issueViewStore?.getIssues).map((_issueStateKey: any) => (
                  <div
                    key={`${_issueStateKey}`}
                    className="flex-shrink-0 w-[380px] h-full relative flex flex-col"
                  >
                    <div className="flex-shrink-0 w-full p-2 py-1">
                      <IssueHeader />
                    </div>

                    <div className="w-full h-full overflow-auto">
                      <Droppable droppableId={`${_issueStateKey}`}>
                        {(provided: any, snapshot: any) => (
                          <>
                            <div {...provided.droppableProps} ref={provided.innerRef}>
                              <IssueContent
                                columnId={_issueStateKey}
                                issues={issueViewStore?.getIssues[_issueStateKey]}
                              />
                            </div>
                            {provided.placeholder}
                          </>
                        )}
                      </Droppable>
                    </div>

                    <div className="flex-shrink-0 w-full p-2 py-1">
                      <IssueFooter />
                    </div>
                  </div>
                ))}
              </DragDropContext>
            </div>
          ) : (
            <div>No Issues are available</div>
          )}
        </div>
      )}
    </div>
  );
});
