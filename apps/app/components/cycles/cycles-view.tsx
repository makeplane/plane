import React from "react";
import dynamic from "next/dynamic";
// headless ui
import { Tab } from "@headlessui/react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import {
  ActiveCycleDetails,
  CompletedCyclesListProps,
  AllCyclesBoard,
  AllCyclesList,
  CompletedCycles,
} from "components/cycles";
// ui
import { EmptyState, Loader } from "components/ui";
// icons
import { ChartBarIcon, ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
import emptyCycle from "public/empty-state/empty-cycle.svg";
// types
import {
  SelectCycleType,
  ICycle,
  CurrentAndUpcomingCyclesResponse,
  DraftCyclesResponse,
} from "types";

type Props = {
  setSelectedCycle: React.Dispatch<React.SetStateAction<SelectCycleType>>;
  setCreateUpdateCycleModal: React.Dispatch<React.SetStateAction<boolean>>;
  cyclesCompleteList: ICycle[] | undefined;
  currentAndUpcomingCycles: CurrentAndUpcomingCyclesResponse | undefined;
  draftCycles: DraftCyclesResponse | undefined;
};

export const CyclesView: React.FC<Props> = ({
  setSelectedCycle,
  setCreateUpdateCycleModal,
  cyclesCompleteList,
  currentAndUpcomingCycles,
  draftCycles,
}) => {
  const { storedValue: cycleTab, setValue: setCycleTab } = useLocalStorage("cycleTab", "All");
  const { storedValue: cycleView, setValue: setCycleView } = useLocalStorage("cycleView", "list");

  const currentTabValue = (tab: string | null) => {
    switch (tab) {
      case "All":
        return 0;
      case "Active":
        return 1;
      case "Upcoming":
        return 2;
      case "Completed":
        return 3;
      case "Drafts":
        return 4;
      default:
        return 0;
    }
  };

  const CompletedCycles = dynamic<CompletedCyclesListProps>(
    () => import("components/cycles").then((a) => a.CompletedCycles),
    {
      ssr: false,
      loading: () => (
        <Loader className="mb-5">
          <Loader.Item height="12rem" width="100%" />
        </Loader>
      ),
    }
  );

  return (
    <div>
      <Tab.Group
        defaultIndex={currentTabValue(cycleTab)}
        onChange={(i) => {
          switch (i) {
            case 0:
              return setCycleTab("All");
            case 1:
              return setCycleTab("Active");
            case 2:
              return setCycleTab("Upcoming");
            case 3:
              return setCycleTab("Completed");
            case 4:
              return setCycleTab("Drafts");

            default:
              return setCycleTab("All");
          }
        }}
      >
        {" "}
        <div className="flex justify-between">
          <Tab.List as="div" className="flex flex-wrap items-center justify-start gap-4 text-base">
            {["All", "Active", "Upcoming", "Completed", "Drafts"].map((tab, index) => (
              <Tab
                key={index}
                className={({ selected }) =>
                  `rounded-3xl border px-6 py-1 outline-none ${
                    selected
                      ? "border-brand-accent bg-brand-accent text-white font-medium"
                      : "border-brand-base bg-brand-base hover:bg-brand-surface-2"
                  }`
                }
              >
                {tab}
              </Tab>
            ))}
          </Tab.List>
          {cycleTab !== "Active" && (
            <div className="flex items-center gap-x-1">
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 ${
                  cycleView === "list" ? "bg-brand-surface-2" : ""
                } hover:bg-brand-surface-2`}
                onClick={() => setCycleView("list")}
              >
                <ListBulletIcon className="h-4 w-4 text-brand-secondary" />
              </button>
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 ${
                  cycleView === "board" ? "bg-brand-surface-2" : ""
                } hover:bg-brand-surface-2`}
                onClick={() => setCycleView("board")}
              >
                <Squares2X2Icon className="h-4 w-4 text-brand-secondary" />
              </button>
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 ${
                  cycleView === "gantt" ? "bg-brand-surface-2" : ""
                } hover:bg-brand-surface-2`}
                onClick={() => setCycleView("gantt")}
              >
                <ChartBarIcon className="h-4 w-4 text-brand-secondary" />
              </button>
            </div>
          )}
        </div>
        <Tab.Panels>
          <Tab.Panel as="div" className="mt-7 space-y-5">
            {cycleView === "list" && (
              <AllCyclesList
                cycles={cyclesCompleteList}
                setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                setSelectedCycle={setSelectedCycle}
                type="current"
              />
            )}
            {cycleView === "board" && (
              <AllCyclesBoard
                cycles={cyclesCompleteList}
                setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                setSelectedCycle={setSelectedCycle}
                type="current"
              />
            )}
            {cycleView === "gantt" && (
              <EmptyState
                type="cycle"
                title="Create New Cycle"
                description="Sprint more effectively with Cycles by confining your project to a fixed amount of time. Create new cycle now."
                imgURL={emptyCycle}
              />
            )}
          </Tab.Panel>
          <Tab.Panel as="div" className="mt-7 space-y-5">
            {currentAndUpcomingCycles?.current_cycle?.[0] ? (
              <ActiveCycleDetails cycle={currentAndUpcomingCycles?.current_cycle?.[0]} />
            ) : (
              <EmptyState
                type="cycle"
                title="Create New Cycle"
                description="Sprint more effectively with Cycles by confining your project to a fixed amount of time. Create new cycle now."
                imgURL={emptyCycle}
              />
            )}
          </Tab.Panel>
          <Tab.Panel as="div" className="mt-7 space-y-5">
            {cycleView === "list" && (
              <AllCyclesList
                cycles={currentAndUpcomingCycles?.upcoming_cycle}
                setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                setSelectedCycle={setSelectedCycle}
                type="upcoming"
              />
            )}
            {cycleView === "board" && (
              <AllCyclesBoard
                cycles={currentAndUpcomingCycles?.upcoming_cycle}
                setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                setSelectedCycle={setSelectedCycle}
                type="upcoming"
              />
            )}
            {cycleView === "gantt" && (
              <EmptyState
                type="cycle"
                title="Create New Cycle"
                description="Sprint more effectively with Cycles by confining your project to a fixed amount of time. Create new cycle now."
                imgURL={emptyCycle}
              />
            )}
          </Tab.Panel>
          <Tab.Panel as="div" className="mt-7 space-y-5">
            <CompletedCycles
              cycleView={cycleView ?? "list"}
              setCreateUpdateCycleModal={setCreateUpdateCycleModal}
              setSelectedCycle={setSelectedCycle}
            />
          </Tab.Panel>
          <Tab.Panel as="div" className="mt-7 space-y-5">
            {cycleView === "list" && (
              <AllCyclesList
                cycles={draftCycles?.draft_cycles}
                setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                setSelectedCycle={setSelectedCycle}
                type="draft"
              />
            )}
            {cycleView === "board" && (
              <AllCyclesBoard
                cycles={draftCycles?.draft_cycles}
                setCreateUpdateCycleModal={setCreateUpdateCycleModal}
                setSelectedCycle={setSelectedCycle}
                type="draft"
              />
            )}
            {cycleView === "gantt" && (
              <EmptyState
                type="cycle"
                title="Create New Cycle"
                description="Sprint more effectively with Cycles by confining your project to a fixed amount of time. Create new cycle now."
                imgURL={emptyCycle}
              />
            )}
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
