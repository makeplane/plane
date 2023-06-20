import React from "react";

// headless ui
import { Tab } from "@headlessui/react";
// hooks
import useLocalStorage from "hooks/use-local-storage";
// components
import { SingleProgressStats } from "components/core";
// ui
import { Avatar } from "components/ui";
// types
import { ICycle } from "types";
// types
type Props = {
  cycle: ICycle;
};

export const ActiveCycleProgressStats: React.FC<Props> = ({ cycle }) => {
  const { storedValue: tab, setValue: setTab } = useLocalStorage("activeCycleTab", "Assignees");

  const currentValue = (tab: string | null) => {
    switch (tab) {
      case "Assignees":
        return 0;
      case "Labels":
        return 1;

      default:
        return 0;
    }
  };

  return (
    <Tab.Group
      defaultIndex={currentValue(tab)}
      onChange={(i) => {
        switch (i) {
          case 0:
            return setTab("Assignees");
          case 1:
            return setTab("Labels");

          default:
            return setTab("Assignees");
        }
      }}
    >
      <Tab.List
        as="div"
        className="flex sticky top-0 z-10 bg-brand-base w-full px-4 pt-4 pb-1 flex-wrap items-center justify-start gap-4 text-sm"
      >
        <Tab
          className={({ selected }) =>
            `px-3 py-1 text-brand-base rounded-3xl border border-brand-base ${
              selected ? " bg-brand-accent text-white" : "  hover:bg-brand-surface-2"
            }`
          }
        >
          Assignees
        </Tab>
        <Tab
          className={({ selected }) =>
            `px-3 py-1 text-brand-base rounded-3xl border border-brand-base ${
              selected ? " bg-brand-accent text-white" : "  hover:bg-brand-surface-2"
            }`
          }
        >
          Labels
        </Tab>
      </Tab.List>
      <Tab.Panels className="flex w-full px-4 pb-4">
        <Tab.Panel
          as="div"
          className="flex flex-col w-full mt-2 gap-1 overflow-y-scroll items-center text-brand-secondary"
        >
          {cycle.distribution.assignees.map((assignee, index) => {
            if (assignee.assignee_id)
              return (
                <SingleProgressStats
                  key={assignee.assignee_id}
                  title={
                    <div className="flex items-center gap-2">
                      <Avatar
                        user={{
                          id: assignee.assignee_id,
                          avatar: assignee.avatar ?? "",
                          first_name: assignee.first_name ?? "",
                          last_name: assignee.last_name ?? "",
                        }}
                      />
                      <span>{assignee.first_name}</span>
                    </div>
                  }
                  completed={assignee.completed_issues}
                  total={assignee.total_issues}
                />
              );
            else
              return (
                <SingleProgressStats
                  key={`unassigned-${index}`}
                  title={
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full border-2 border-brand-base bg-brand-surface-2">
                        <img
                          src="/user.png"
                          height="100%"
                          width="100%"
                          className="rounded-full"
                          alt="User"
                        />
                      </div>
                      <span>No assignee</span>
                    </div>
                  }
                  completed={assignee.completed_issues}
                  total={assignee.total_issues}
                />
              );
          })}
        </Tab.Panel>
        <Tab.Panel
          as="div"
          className="flex flex-col w-full mt-2 gap-1 overflow-y-scroll items-center text-brand-secondary"
        >
          {cycle.distribution.labels.map((label, index) => (
            <SingleProgressStats
              key={label.label_id ?? `no-label-${index}`}
              title={
                <div className="flex items-center gap-2">
                  <span
                    className="block h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: label.color ?? "transparent",
                    }}
                  />
                  <span className="text-xs">{label.label_name ?? "No labels"}</span>
                </div>
              }
              completed={label.completed_issues}
              total={label.total_issues}
            />
          ))}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};
