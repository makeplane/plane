import React, { useRef, useState } from "react";

import { useRouter } from "next/router";

import useSWR from "swr";

// services
import stateService from "services/state.service";
import trackEventServices from "services/track-event.service";
// hooks
import useOutsideClickDetector from "hooks/use-outside-click-detector";
// headless ui
import { Combobox, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { CheckIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { StateGroupIcon } from "components/icons";
// types
import { Tooltip } from "components/ui";
// constants
import { STATES_LIST } from "constants/fetch-keys";
import { ICurrentUserResponse, IIssue } from "types";
// helper
import { getStatesList } from "helpers/state.helper";

type Props = {
  issue: IIssue;
  partialUpdateIssue: (formData: Partial<IIssue>, issue: IIssue) => void;
  className?: string;
  buttonClassName?: string;
  optionsClassName?: string;
  noBorder?: boolean;
  noChevron?: boolean;
  disabled?: boolean;
  user: ICurrentUserResponse | undefined;
};

export const StateSelect: React.FC<Props> = ({
  issue,
  partialUpdateIssue,
  className = "",
  buttonClassName = "",
  optionsClassName = "",
  noChevron = false,
  noBorder = false,
  disabled = false,
  user,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [fetchStates, setFetchStates] = useState(false);

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const dropdownBtn = useRef<any>(null);
  const dropdownOptions = useRef<any>(null);

  const { data: stateGroups } = useSWR(
    workspaceSlug && issue && fetchStates ? STATES_LIST(issue.project) : null,
    workspaceSlug && issue && fetchStates
      ? () => stateService.getStates(workspaceSlug as string, issue.project)
      : null
  );
  const states = getStatesList(stateGroups);

  const options = states?.map((state) => ({
    value: state.id,
    query: state.name,
    content: (
      <div className="flex items-center gap-2">
        <StateGroupIcon stateGroup={state.group} color={state.color} />
        {state.name}
      </div>
    ),
  }));

  const filteredOptions =
    query === ""
      ? options
      : options?.filter((option) => option.query.toLowerCase().includes(query.toLowerCase()));

  const handleOnOpen = () => {
    const dropdownOptionsRef = dropdownOptions.current;
    const dropdownBtnRef = dropdownBtn.current;

    if (!dropdownOptionsRef || !dropdownBtnRef) return;

    const dropdownWidth = dropdownOptionsRef.clientWidth;
    const dropdownHeight = dropdownOptionsRef.clientHeight;

    const dropdownBtnX = dropdownBtnRef.getBoundingClientRect().x;
    const dropdownBtnY = dropdownBtnRef.getBoundingClientRect().y;
    const dropdownBtnHeight = dropdownBtnRef.clientHeight;

    let top = dropdownBtnY + dropdownBtnHeight;
    if (dropdownBtnY + dropdownHeight > window.innerHeight)
      top = dropdownBtnY - dropdownHeight - 10;
    else top = top + 10;

    let left = dropdownBtnX;
    if (dropdownBtnX + dropdownWidth > window.innerWidth) left = dropdownBtnX - dropdownWidth;

    dropdownOptionsRef.style.top = `${Math.round(top)}px`;
    dropdownOptionsRef.style.left = `${Math.round(left)}px`;
  };

  const selectedOption = issue.state_detail;

  const label = (
    <Tooltip tooltipHeading="State" tooltipContent={selectedOption?.name ?? ""} position="top">
      <div className="flex items-center cursor-pointer w-full gap-2 text-custom-text-200">
        <span className="h-3.5 w-3.5">
          {selectedOption && (
            <StateGroupIcon stateGroup={selectedOption.group} color={selectedOption.color} />
          )}
        </span>
        <span className="truncate">{selectedOption?.name ?? "State"}</span>
      </div>
    </Tooltip>
  );

  useOutsideClickDetector(dropdownOptions, () => {
    if (isOpen) setIsOpen(false);
  });

  return (
    <Combobox
      as="div"
      className={`flex-shrink-0 text-left ${className}`}
      value={issue.state}
      onChange={(data: string) => {
        const oldState = states?.find((s) => s.id === issue.state);
        const newState = states?.find((s) => s.id === data);

        partialUpdateIssue(
          {
            state: data,
            state_detail: newState,
          },
          issue
        );
        trackEventServices.trackIssuePartialPropertyUpdateEvent(
          {
            workspaceSlug,
            workspaceId: issue.workspace,
            projectId: issue.project_detail.id,
            projectIdentifier: issue.project_detail.identifier,
            projectName: issue.project_detail.name,
            issueId: issue.id,
          },
          "ISSUE_PROPERTY_UPDATE_STATE",
          user
        );

        if (oldState?.group !== "completed" && newState?.group !== "completed") {
          trackEventServices.trackIssueMarkedAsDoneEvent(
            {
              workspaceSlug: issue.workspace_detail.slug,
              workspaceId: issue.workspace_detail.id,
              projectId: issue.project_detail.id,
              projectIdentifier: issue.project_detail.identifier,
              projectName: issue.project_detail.name,
              issueId: issue.id,
            },
            user
          );
        }
      }}
      disabled={disabled}
    >
      {({ open }: { open: boolean }) => {
        if (open) {
          handleOnOpen();
          setFetchStates(true);
        }

        return (
          <>
            <Combobox.Button
              ref={dropdownBtn}
              type="button"
              className={`flex items-center justify-between gap-1 w-full ${
                noBorder
                  ? ""
                  : "px-2.5 py-1 rounded-md shadow-sm border border-custom-border-300 duration-300 focus:outline-none"
              } text-xs ${
                disabled
                  ? "cursor-not-allowed text-custom-text-200"
                  : "cursor-pointer hover:bg-custom-background-80"
              } ${buttonClassName}`}
            >
              {label}
              {!noChevron && !disabled && (
                <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
              )}
            </Combobox.Button>
            <Transition
              show={open}
              as={React.Fragment}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <div className="fixed z-20 top-0 left-0 h-full w-full cursor-auto">
                <Combobox.Options
                  ref={dropdownOptions}
                  className={`absolute z-10 border border-custom-border-300 px-2 py-2.5 rounded bg-custom-background-100 text-xs shadow-lg focus:outline-none w-48 whitespace-nowrap ${optionsClassName}`}
                >
                  <div className="flex w-full items-center justify-start rounded border border-custom-border-200 bg-custom-background-90 px-2">
                    <MagnifyingGlassIcon className="h-3.5 w-3.5 text-custom-text-300" />
                    <Combobox.Input
                      className="w-full bg-transparent py-1 px-2 text-xs text-custom-text-200 placeholder:text-custom-text-400 focus:outline-none"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search"
                      displayValue={(assigned: any) => assigned?.name}
                    />
                  </div>
                  <div className={`mt-2 space-y-1 max-h-48 overflow-y-scroll`}>
                    {filteredOptions ? (
                      filteredOptions.length > 0 ? (
                        filteredOptions.map((option) => (
                          <Combobox.Option
                            key={option.value}
                            value={option.value}
                            className={({ active, selected }) =>
                              `flex items-center justify-between gap-2 cursor-pointer select-none truncate rounded px-1 py-1.5 ${
                                active && !selected ? "bg-custom-background-80" : ""
                              } ${selected ? "text-custom-text-100" : "text-custom-text-200"}`
                            }
                          >
                            {({ active, selected }) => (
                              <>
                                {option.content}
                                <CheckIcon
                                  className={`h-3.5 w-3.5 ${
                                    selected ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                              </>
                            )}
                          </Combobox.Option>
                        ))
                      ) : (
                        <span className="flex items-center gap-2 p-1">
                          <p className="text-left text-custom-text-200 ">No matching results</p>
                        </span>
                      )
                    ) : (
                      <p className="text-center text-custom-text-200">Loading...</p>
                    )}
                  </div>
                </Combobox.Options>
              </div>
            </Transition>
          </>
        );
      }}
    </Combobox>
  );
};
