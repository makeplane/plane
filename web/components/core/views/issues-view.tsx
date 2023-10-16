// import { useCallback, useEffect, useState, FC } from "react";
// import { useRouter } from "next/router";
// import useSWR, { mutate } from "swr";
// import { DropResult } from "react-beautiful-dnd";
// // services
// import { IssueService, IssueLabelService } from "services/issue";
// import { ProjectStateService } from "services/project";
// import { ModuleService } from "services/module.service";
// import { TrackEventService } from "services/track_event.service";
// // hooks
// import useToast from "hooks/use-toast";
// import useIssuesView from "hooks/use-issues-view";
// import useUserAuth from "hooks/use-user-auth";
// import useIssuesProperties from "hooks/use-issue-properties";
// import useProjectMembers from "hooks/use-project-members";
// // components
// import { FiltersList } from "components/core";
// import {
//   CreateUpdateIssueModal,
//   DeleteIssueModal,
//   DeleteDraftIssueModal,
//   CreateUpdateDraftIssueModal,
// } from "components/issues";
// import { CreateUpdateViewModal } from "components/views";
// // ui
// import { Button } from "@plane/ui";
// // icons
// import { PlusIcon } from "@heroicons/react/24/outline";
// // helpers
// import { getStatesList } from "helpers/state.helper";
// import { orderArrayBy } from "helpers/array.helper";
// // types
// import { IIssue, IIssueFilterOptions, IState, TIssuePriorities } from "types";
// // fetch-keys
// import {
//   CYCLE_DETAILS,
//   CYCLE_ISSUES_WITH_PARAMS,
//   MODULE_DETAILS,
//   MODULE_ISSUES_WITH_PARAMS,
//   PROJECT_ISSUES_LIST_WITH_PARAMS,
//   PROJECT_ISSUE_LABELS,
//   STATES_LIST,
// } from "constants/fetch-keys";

// type Props = {
//   openIssuesListModal?: () => void;
//   disableUserActions?: boolean;
// };

// const issueService = new IssueService();
// const issueLabelService = new IssueLabelService();
// const projectStateService = new ProjectStateService();
// const moduleService = new ModuleService();
// const trackEventService = new TrackEventService();

// export const IssuesView: FC<Props> = () => {
//   // const { openIssuesListModal, disableUserActions = false } = props;
//   // create issue modal
//   const [createIssueModal, setCreateIssueModal] = useState(false);
//   const [createViewModal, setCreateViewModal] = useState<any>(null);
//   const [preloadedData, setPreloadedData] = useState<
//     (Partial<IIssue> & { actionType: "createIssue" | "edit" | "delete" }) | undefined
//   >(undefined);

//   // update issue modal
//   const [editIssueModal, setEditIssueModal] = useState(false);
//   const [issueToEdit, setIssueToEdit] = useState<(IIssue & { actionType: "edit" | "delete" }) | undefined>(undefined);

//   // delete issue modal
//   const [deleteIssueModal, setDeleteIssueModal] = useState(false);
//   const [issueToDelete, setIssueToDelete] = useState<IIssue | null>(null);

//   // trash box
//   // const [trashBox, setTrashBox] = useState(false);

//   // selected draft issue
//   const [selectedDraftIssue, setSelectedDraftIssue] = useState<IIssue | null>(null);
//   const [selectedDraftForDelete, setSelectDraftForDelete] = useState<IIssue | null>(null);

//   const router = useRouter();
//   const { workspaceSlug, projectId, cycleId, moduleId, viewId } = router.query;

//   const isDraftIssues = router.pathname?.split("/")?.[4] === "draft-issues";
//   // const isArchivedIssues = router.pathname?.split("/")?.[4] === "archived-issues";

//   const { user } = useUserAuth();

//   const { setToastAlert } = useToast();

//   const { groupedByIssues, mutateIssues, displayFilters, filters, isEmpty, setFilters, params, setDisplayFilters } =
//     useIssuesView();
//   const [properties] = useIssuesProperties(workspaceSlug as string, projectId as string);

//   const { data: stateGroups } = useSWR(
//     workspaceSlug && projectId ? STATES_LIST(projectId as string) : null,
//     workspaceSlug ? () => projectStateService.getStates(workspaceSlug as string, projectId as string) : null
//   );
//   const states = getStatesList(stateGroups);

//   const { data: labels } = useSWR(
//     workspaceSlug && projectId ? PROJECT_ISSUE_LABELS(projectId.toString()) : null,
//     workspaceSlug && projectId
//       ? () => issueLabelService.getProjectIssueLabels(workspaceSlug.toString(), projectId.toString())
//       : null
//   );

//   const { members } = useProjectMembers(workspaceSlug?.toString(), projectId?.toString());

//   useEffect(() => {
//     if (!isDraftIssues) return;

//     if (
//       displayFilters.layout === "calendar" ||
//       displayFilters.layout === "gantt_chart" ||
//       displayFilters.layout === "spreadsheet"
//     )
//       setDisplayFilters({ layout: "list" });
//   }, [isDraftIssues, displayFilters, setDisplayFilters]);

//   const handleDeleteIssue = useCallback(
//     (issue: IIssue) => {
//       setDeleteIssueModal(true);
//       setIssueToDelete(issue);
//     },
//     [setDeleteIssueModal, setIssueToDelete]
//   );

//   const handleDraftIssueClick = useCallback((issue: any) => setSelectedDraftIssue(issue), []);
//   const handleDraftIssueDelete = useCallback((issue: any) => setSelectDraftForDelete(issue), []);

//   const handleOnDragEnd = useCallback(
//     async (result: DropResult) => {
//       setTrashBox(false);

//       if (!result.destination || !workspaceSlug || !projectId || !groupedByIssues) return;

//       const { source, destination } = result;

//       const draggedItem = groupedByIssues[source.droppableId][source.index];

//       if (destination.droppableId === "trashBox") {
//         handleDeleteIssue(draggedItem);
//       } else {
//         if (displayFilters.order_by === "sort_order") {
//           let newSortOrder = draggedItem.sort_order;

//           const destinationGroupArray = groupedByIssues[destination.droppableId];

//           if (destinationGroupArray.length !== 0) {
//             // check if dropping in the same group
//             if (source.droppableId === destination.droppableId) {
//               // check if dropping at beginning
//               if (destination.index === 0) newSortOrder = destinationGroupArray[0].sort_order - 10000;
//               // check if dropping at last
//               else if (destination.index === destinationGroupArray.length - 1)
//                 newSortOrder = destinationGroupArray[destinationGroupArray.length - 1].sort_order + 10000;
//               else {
//                 if (destination.index > source.index)
//                   newSortOrder =
//                     (destinationGroupArray[source.index + 1].sort_order +
//                       destinationGroupArray[source.index + 2].sort_order) /
//                     2;
//                 else if (destination.index < source.index)
//                   newSortOrder =
//                     (destinationGroupArray[source.index - 1].sort_order +
//                       destinationGroupArray[source.index - 2].sort_order) /
//                     2;
//               }
//             } else {
//               // check if dropping at beginning
//               if (destination.index === 0) newSortOrder = destinationGroupArray[0].sort_order - 10000;
//               // check if dropping at last
//               else if (destination.index === destinationGroupArray.length)
//                 newSortOrder = destinationGroupArray[destinationGroupArray.length - 1].sort_order + 10000;
//               else
//                 newSortOrder =
//                   (destinationGroupArray[destination.index - 1].sort_order +
//                     destinationGroupArray[destination.index].sort_order) /
//                   2;
//             }
//           }

//           draggedItem.sort_order = newSortOrder;
//         }

//         const destinationGroup = destination.droppableId; // destination group id

//         if (displayFilters.order_by === "sort_order" || source.droppableId !== destination.droppableId) {
//           // different group/column;

//           // source.droppableId !== destination.droppableId -> even if order by is not sort_order,
//           // if the issue is moved to a different group, then we will change the group of the
//           // dragged item(or issue)

//           if (displayFilters.group_by === "priority") draggedItem.priority = destinationGroup as TIssuePriorities;
//           else if (displayFilters.group_by === "state") {
//             draggedItem.state = destinationGroup;
//             draggedItem.state_detail = states?.find((s) => s.id === destinationGroup) as IState;
//           }
//         }

//         const sourceGroup = source.droppableId; // source group id

//         mutate<{
//           [key: string]: IIssue[];
//         }>(
//           cycleId
//             ? CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params)
//             : moduleId
//             ? MODULE_ISSUES_WITH_PARAMS(moduleId as string, params)
//             : PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params),
//           (prevData) => {
//             if (!prevData) return prevData;

//             const sourceGroupArray = [...groupedByIssues[sourceGroup]];
//             const destinationGroupArray = [...groupedByIssues[destinationGroup]];

//             sourceGroupArray.splice(source.index, 1);
//             destinationGroupArray.splice(destination.index, 0, draggedItem);

//             return {
//               ...prevData,
//               [sourceGroup]: orderArrayBy(sourceGroupArray, displayFilters.order_by ?? "-created_at"),
//               [destinationGroup]: orderArrayBy(destinationGroupArray, displayFilters.order_by ?? "-created_at"),
//             };
//           },
//           false
//         );

//         // patch request
//         issueService
//           .patchIssue(
//             workspaceSlug as string,
//             projectId as string,
//             draggedItem.id,
//             {
//               priority: draggedItem.priority,
//               state: draggedItem.state,
//               sort_order: draggedItem.sort_order,
//             },
//             user
//           )
//           .then((response) => {
//             const sourceStateBeforeDrag = states?.find((state) => state.name === source.droppableId);

//             if (sourceStateBeforeDrag?.group !== "completed" && response?.state_detail?.group === "completed")
//               trackEventService.trackIssueMarkedAsDoneEvent(
//                 {
//                   workspaceSlug,
//                   workspaceId: draggedItem.workspace,
//                   projectName: draggedItem.project_detail.name,
//                   projectIdentifier: draggedItem.project_detail.identifier,
//                   projectId,
//                   issueId: draggedItem.id,
//                 },
//                 user
//               );

//             if (cycleId) {
//               mutate(CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params));
//               mutate(CYCLE_DETAILS(cycleId as string));
//             }
//             if (moduleId) {
//               mutate(MODULE_ISSUES_WITH_PARAMS(moduleId as string, params));
//               mutate(MODULE_DETAILS(moduleId as string));
//             }
//             mutate(PROJECT_ISSUES_LIST_WITH_PARAMS(projectId as string, params));
//           });
//       }
//     },
//     [
//       displayFilters.group_by,
//       displayFilters.order_by,
//       workspaceSlug,
//       cycleId,
//       moduleId,
//       groupedByIssues,
//       projectId,
//       handleDeleteIssue,
//       params,
//       states,
//       user,
//     ]
//   );

//   const addIssueToGroup = useCallback(
//     (groupTitle: string) => {
//       setCreateIssueModal(true);

//       let preloadedValue: string | string[] = groupTitle;

//       if (displayFilters.group_by === "labels") {
//         if (groupTitle === "None") preloadedValue = [];
//         else preloadedValue = [groupTitle];
//       }

//       if (displayFilters.group_by)
//         setPreloadedData({
//           [displayFilters.group_by]: preloadedValue,
//           actionType: "createIssue",
//         });
//       else setPreloadedData({ actionType: "createIssue" });
//     },
//     [displayFilters.group_by, setCreateIssueModal, setPreloadedData]
//   );

//   const addIssueToDate = useCallback(
//     (date: string) => {
//       setCreateIssueModal(true);
//       setPreloadedData({
//         target_date: date,
//         actionType: "createIssue",
//       });
//     },
//     [setCreateIssueModal, setPreloadedData]
//   );

//   const makeIssueCopy = useCallback(
//     (issue: IIssue) => {
//       setCreateIssueModal(true);

//       setPreloadedData({ ...issue, name: `${issue.name} (Copy)`, actionType: "createIssue" });
//     },
//     [setCreateIssueModal, setPreloadedData]
//   );

//   const handleEditIssue = useCallback(
//     (issue: IIssue) => {
//       setEditIssueModal(true);
//       setIssueToEdit({
//         ...issue,
//         actionType: "edit",
//         cycle: issue.issue_cycle ? issue.issue_cycle.cycle : null,
//         module: issue.issue_module ? issue.issue_module.module : null,
//       });
//     },
//     [setEditIssueModal, setIssueToEdit]
//   );

//   const handleIssueAction = useCallback(
//     (issue: IIssue, action: "copy" | "edit" | "delete") => {
//       if (action === "copy") makeIssueCopy(issue);
//       else if (action === "edit") handleEditIssue(issue);
//       else if (action === "delete") handleDeleteIssue(issue);
//     },
//     [makeIssueCopy, handleEditIssue, handleDeleteIssue]
//   );

//   const handleDraftIssueAction = useCallback(
//     (issue: IIssue, action: "edit" | "delete") => {
//       if (action === "edit") handleDraftIssueClick(issue);
//       else if (action === "delete") handleDraftIssueDelete(issue);
//     },
//     [handleDraftIssueClick, handleDraftIssueDelete]
//   );

//   const removeIssueFromCycle = useCallback(
//     (bridgeId: string, issueId: string) => {
//       if (!workspaceSlug || !projectId || !cycleId) return;

//       mutate(
//         CYCLE_ISSUES_WITH_PARAMS(cycleId as string, params),
//         (prevData: any) => {
//           if (!prevData) return prevData;
//           if (displayFilters.group_by) {
//             const filteredData: any = {};
//             for (const key in prevData) {
//               filteredData[key] = prevData[key].filter((item: any) => item.id !== issueId);
//             }
//             return filteredData;
//           } else {
//             const filteredData = prevData.filter((i: any) => i.id !== issueId);
//             return filteredData;
//           }
//         },
//         false
//       );

//       issueService
//         .removeIssueFromCycle(workspaceSlug as string, projectId as string, cycleId as string, bridgeId)
//         .then(() => {
//           setToastAlert({
//             title: "Success",
//             message: "Issue removed successfully.",
//             type: "success",
//           });
//         })
//         .catch((e) => {
//           console.log(e);
//         });
//     },
//     [displayFilters.group_by, workspaceSlug, projectId, cycleId, params, setToastAlert]
//   );

//   const removeIssueFromModule = useCallback(
//     (bridgeId: string, issueId: string) => {
//       if (!workspaceSlug || !projectId || !moduleId) return;

//       mutate(
//         MODULE_ISSUES_WITH_PARAMS(moduleId as string, params),
//         (prevData: any) => {
//           if (!prevData) return prevData;
//           if (displayFilters.group_by) {
//             const filteredData: any = {};
//             for (const key in prevData) {
//               filteredData[key] = prevData[key].filter((item: any) => item.id !== issueId);
//             }
//             return filteredData;
//           } else {
//             const filteredData = prevData.filter((item: any) => item.id !== issueId);
//             return filteredData;
//           }
//         },
//         false
//       );

//       moduleService
//         .removeIssueFromModule(workspaceSlug as string, projectId as string, moduleId as string, bridgeId)
//         .then(() => {
//           setToastAlert({
//             title: "Success",
//             message: "Issue removed successfully.",
//             type: "success",
//           });
//         })
//         .catch((e) => {
//           console.log(e);
//         });
//     },
//     [displayFilters.group_by, workspaceSlug, projectId, moduleId, params, setToastAlert]
//   );

//   const nullFilters = Object.keys(filters).filter((key) => filters[key as keyof IIssueFilterOptions] === null);

//   const areFiltersApplied = Object.keys(filters).length > 0 && nullFilters.length !== Object.keys(filters).length;

//   return (
//     <>
//       <CreateUpdateViewModal
//         isOpen={createViewModal !== null}
//         handleClose={() => setCreateViewModal(null)}
//         preLoadedData={createViewModal}
//         user={user}
//       />
//       <CreateUpdateIssueModal
//         isOpen={createIssueModal && preloadedData?.actionType === "createIssue"}
//         handleClose={() => setCreateIssueModal(false)}
//         prePopulateData={{
//           ...preloadedData,
//         }}
//       />
//       <CreateUpdateDraftIssueModal
//         isOpen={selectedDraftIssue !== null}
//         handleClose={() => setSelectedDraftIssue(null)}
//         data={
//           selectedDraftIssue
//             ? {
//                 ...selectedDraftIssue,
//                 is_draft: true,
//               }
//             : null
//         }
//         fieldsToShow={["all"]}
//       />
//       <CreateUpdateIssueModal
//         isOpen={editIssueModal && issueToEdit?.actionType !== "delete"}
//         handleClose={() => setEditIssueModal(false)}
//         data={issueToEdit}
//       />
//       <DeleteIssueModal
//         handleClose={() => setDeleteIssueModal(false)}
//         isOpen={deleteIssueModal}
//         data={issueToDelete}
//         user={user}
//       />
//       <DeleteDraftIssueModal
//         data={selectedDraftForDelete}
//         isOpen={selectedDraftForDelete !== null}
//         handleClose={() => setSelectDraftForDelete(null)}
//       />

//       {areFiltersApplied && (
//         <>
//           <div className="flex items-center justify-between gap-2 px-5 pt-3 pb-0">
//             <FiltersList
//               filters={filters}
//               setFilters={(updatedFilter) => setFilters(updatedFilter, !Boolean(viewId))}
//               labels={labels}
//               members={members?.map((m: any) => m.member)}
//               states={states}
//               clearAllFilters={() =>
//                 setFilters({
//                   assignees: null,
//                   created_by: null,
//                   labels: null,
//                   priority: null,
//                   state: null,
//                   state_group: null,
//                   start_date: null,
//                   target_date: null,
//                 })
//               }
//             />
//             <Button
//               variant="primary"
//               prependIcon={!viewId && <PlusIcon />}
//               onClick={() => {
//                 if (viewId) {
//                   setFilters({}, true);
//                   setToastAlert({
//                     title: "View updated",
//                     message: "Your view has been updated",
//                     type: "success",
//                   });
//                 } else
//                   setCreateViewModal({
//                     query: filters,
//                   });
//               }}
//             >
//               {viewId ? "Update" : "Save"} view
//             </Button>
//           </div>
//           {<div className="mt-3 border-t border-custom-border-200" />}
//         </>
//       )}
//       {/* <AllViews
//         addIssueToDate={addIssueToDate}
//         addIssueToGroup={addIssueToGroup}
//         disableUserActions={disableUserActions}
//         dragDisabled={
//           displayFilters.group_by === "created_by" ||
//           displayFilters.group_by === "labels" ||
//           displayFilters.group_by === "state_detail.group" ||
//           displayFilters.group_by === "assignees"
//         }
//         emptyState={{
//           title: isDraftIssues
//             ? "Draft issues will appear here"
//             : cycleId
//             ? "Cycle issues will appear here"
//             : moduleId
//             ? "Module issues will appear here"
//             : "Project issues will appear here",
//           description: isDraftIssues
//             ? "Draft issues are issues that are not yet created."
//             : "Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done.",
//           primaryButton: !isDraftIssues
//             ? {
//                 icon: <PlusIcon className="h-4 w-4" />,
//                 text: "New Issue",
//                 onClick: () => {
//                   const e = new KeyboardEvent("keydown", {
//                     key: "c",
//                   });
//                   document.dispatchEvent(e);
//                 },
//               }
//             : undefined,
//           secondaryButton:
//             cycleId || moduleId ? (
//               <Button variant="neutral-primary" prependIcon={<PlusIcon />} onClick={openIssuesListModal ?? (() => {})}>
//                 Add an existing issue
//               </Button>
//             ) : null,
//         }}
//         handleOnDragEnd={handleOnDragEnd}
//         handleIssueAction={handleIssueAction}
//         handleDraftIssueAction={handleDraftIssueAction}
//         openIssuesListModal={openIssuesListModal ?? null}
//         removeIssue={cycleId ? removeIssueFromCycle : moduleId ? removeIssueFromModule : null}
//         trashBox={trashBox}
//         setTrashBox={setTrashBox}
//         viewProps={{
//           groupedIssues: groupedByIssues,
//           displayFilters,
//           isEmpty,
//           mutateIssues,
//           params,
//           properties,
//         }}
//         disableAddIssueOption={isArchivedIssues}
//       /> */}
//     </>
//   );
// };

export const IssuesView = () => <></>;
