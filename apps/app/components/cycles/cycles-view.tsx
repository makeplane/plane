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
import { Loader } from "components/ui";
// icons
import { ListBulletIcon, Squares2X2Icon } from "@heroicons/react/24/outline";
// types
import {
  SelectCycleType,
  ICycle,
  CurrentAndUpcomingCyclesResponse,
  DraftCyclesResponse,
} from "types";

type Props = {
  cycleView: string;
  setCycleView: React.Dispatch<React.SetStateAction<string>>;
  setSelectedCycle: React.Dispatch<React.SetStateAction<SelectCycleType>>;
  setCreateUpdateCycleModal: React.Dispatch<React.SetStateAction<boolean>>;
  cyclesCompleteList: ICycle[] | undefined;
  currentAndUpcomingCycles: CurrentAndUpcomingCyclesResponse | undefined;
  draftCycles: DraftCyclesResponse | undefined;
};

export const CyclesView: React.FC<Props> = ({
  cycleView,
  setCycleView,
  setSelectedCycle,
  setCreateUpdateCycleModal,
  cyclesCompleteList,
  currentAndUpcomingCycles,
  draftCycles,
}) => {
  const { storedValue: cycleTab, setValue: setCycleTab } = useLocalStorage("cycleTab", "Active");

  const currentTabValue = (tab: string | null) => {
    switch (tab) {
      case "Active":
        return 0;
      case "All":
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

  const tabs = [
    { name: "Active", key: "Active" },
    { name: "All", key: "All" },
    { name: "Upcoming", key: "Upcoming" },
    { name: "Completed", key: "Completed" },
    { name: "Drafts", key: "Drafts" },
  ];

  return (
    <div className=" bg-brand-surface-1">
      <Tab.Group
        defaultIndex={currentTabValue(cycleTab)}
        onChange={(i) => {
          switch (i) {
            case 0:
              return setCycleTab("Active");
            case 1:
              return setCycleTab("All");
            case 2:
              return setCycleTab("Upcoming");
            case 3:
              return setCycleTab("Completed");
            case 4:
              return setCycleTab("Drafts");

            default:
              return setCycleTab("Active");
          }
        }}
      >
        {" "}
        <div className={`flex justify-between ${cycleView === "list" ? "px-8" : "px-8"}`}>
          <Tab.List
            as="div"
            className="flex items-center justify-start gap-4 text-base font-medium"
          >
            {tabs &&
              tabs.map((tab: any, index: number) => (
                <Tab
                  key={index}
                  className={({ selected }) =>
                    `rounded-3xl border px-6 py-1 outline-none ${
                      selected
                        ? "border-brand-accent bg-brand-accent text-white"
                        : "border-brand-base bg-brand-surface-2 hover:bg-brand-surface-1"
                    }`
                  }
                >
                  {tab.name}
                </Tab>
              ))}
          </Tab.List>
          {cycleTab !== "Active" && (
            <div className="flex items-center gap-x-1">
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-brand-surface-2 ${
                  cycleView == "list" ? "bg-brand-surface-2" : ""
                }`}
                onClick={() => setCycleView("list")}
              >
                <ListBulletIcon className="h-4 w-4 text-brand-secondary" />
              </button>
              <button
                type="button"
                className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-brand-surface-2 ${
                  cycleView == "board" ? "bg-brand-surface-2" : ""
                }`}
                onClick={() => setCycleView("board")}
              >
                <Squares2X2Icon className="h-4 w-4 text-brand-secondary" />
              </button>
            </div>
          )}
        </div>
        <Tab.Panels>
          {/* active */}
          <Tab.Panel as="div" className={`mt-8 space-y-5 mx-8`}>
            {currentAndUpcomingCycles?.current_cycle?.[0] && (
              <ActiveCycleDetails cycle={currentAndUpcomingCycles?.current_cycle?.[0]} />
            )}
          </Tab.Panel>
          <Tab.Panel as="div" className="mt-8 space-y-5">
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
          </Tab.Panel>
          <Tab.Panel as="div" className="mt-8 space-y-5">
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
          </Tab.Panel>
          <Tab.Panel
            as="div"
            className={`mt-8 ${cycleView == "board" ? "px-8" : ""}  space-y-5 bg-brand-surface-1`}
          >
            <CompletedCycles
              cycleView={cycleView}
              setCreateUpdateCycleModal={setCreateUpdateCycleModal}
              setSelectedCycle={setSelectedCycle}
            />
          </Tab.Panel>
          <Tab.Panel as="div" className="mt-8 space-y-5  bg-brand-surface-1">
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
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};
