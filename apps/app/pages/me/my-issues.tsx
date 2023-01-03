// react
import React from "react";
// next
import Link from "next/link";
import type { NextPage, NextPageContext } from "next";
import Image from "next/image";
// swr
import useSWR from "swr";
// headless ui
import { Disclosure, Listbox, Menu, Popover, Transition } from "@headlessui/react";
// layouts
import AppLayout from "layouts/app-layout";
// hooks
import useUser from "lib/hooks/useUser";
// headless ui
// ui
import { Spinner, Breadcrumbs, BreadcrumbItem, EmptySpace, EmptySpaceItem, HeaderButton } from "ui";
// icons
import {
  CalendarDaysIcon,
  ChevronDownIcon,
  EllipsisHorizontalIcon,
  PlusIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import User from "public/user.png";
// services
import userService from "lib/services/user.service";
import issuesServices from "lib/services/issues.service";
import workspaceService from "lib/services/workspace.service";
import stateService from "lib/services/state.service";
// hooks
import useIssuesProperties from "lib/hooks/useIssuesProperties";
import useMyIssuesProperties from "lib/hooks/useMyIssueFilter";
// types
import { IIssue, IWorkspaceMember, Properties } from "types";
// constants
import { requiredAuth } from "lib/auth";
import { STATE_LIST, USER_ISSUE, WORKSPACE_MEMBERS } from "constants/fetch-keys";
import {
  addSpaceIfCamelCase,
  classNames,
  findHowManyDaysLeft,
  renderShortNumericDateFormat,
  replaceUnderscoreIfSnakeCase,
} from "constants/common";
import { PRIORITIES } from "constants/";

const MyIssues: NextPage = () => {
  const { activeWorkspace, activeProject, user } = useUser();

  const { data: myIssues, mutate: mutateMyIssues } = useSWR<IIssue[]>(
    user && activeWorkspace ? USER_ISSUE(activeWorkspace.slug) : null,
    user && activeWorkspace ? () => userService.userIssues(activeWorkspace.slug) : null
  );

  const { data: people } = useSWR<IWorkspaceMember[]>(
    activeWorkspace ? WORKSPACE_MEMBERS : null,
    activeWorkspace ? () => workspaceService.workspaceMembers(activeWorkspace.slug) : null
  );

  const { data: states } = useSWR(
    activeWorkspace && activeProject ? STATE_LIST(activeProject.id) : null,
    activeWorkspace && activeProject
      ? () => stateService.getStates(activeWorkspace.slug, activeProject.id)
      : null
  );

  const [properties, setProperties] = useIssuesProperties(
    activeWorkspace?.slug,
    "21b5fab2-cb0c-4875-9496-619134bf1f32"
  );

  const updateMyIssues = (
    workspaceSlug: string,
    projectId: string,
    issueId: string,
    issue: Partial<IIssue>
  ) => {
    mutateMyIssues((prevData) => {
      return prevData?.map((prevIssue) => {
        if (prevIssue.id === issueId) {
          return {
            ...prevIssue,
            ...issue,
            state_detail: {
              ...prevIssue.state_detail,
              ...issue.state_detail,
            },
          };
        }
        return prevIssue;
      });
    }, false);
    issuesServices
      .patchIssue(workspaceSlug, projectId, issueId, issue)
      .then((response) => {
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const { filteredIssues, setMyIssueGroupByProperty, setMyIssueProperty, groupByProperty } =
    useMyIssuesProperties(myIssues);

  return (
    <AppLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Issues" />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          <Popover className="relative">
            {({ open }) => (
              <>
                <Popover.Button
                  className={classNames(
                    open ? "bg-gray-100 text-gray-900" : "text-gray-500",
                    "group flex items-center gap-2 rounded-md border bg-transparent p-2 text-xs font-medium hover:bg-gray-100 hover:text-gray-900 focus:outline-none"
                  )}
                >
                  <span>View</span>
                  <ChevronDownIcon className="h-4 w-4" aria-hidden="true" />
                </Popover.Button>

                <Transition
                  as={React.Fragment}
                  enter="transition ease-out duration-200"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-150"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Popover.Panel className="absolute right-1/2 z-10 mr-5 mt-1 w-screen max-w-xs translate-x-1/2 transform overflow-hidden rounded-lg bg-white p-3 shadow-lg">
                    <div className="relative flex flex-col gap-1 gap-y-4">
                      <div className="relative flex flex-col gap-1">
                        <h4 className="text-base text-gray-600">Properties</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {Object.keys(properties).map((key) => (
                            <button
                              key={key}
                              type="button"
                              className={`rounded border border-theme px-2 py-1 text-xs capitalize ${
                                properties[key as keyof Properties]
                                  ? "border-theme bg-theme text-white"
                                  : ""
                              }`}
                              onClick={() => setProperties(key as keyof Properties)}
                            >
                              {replaceUnderscoreIfSnakeCase(key)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Popover.Panel>
                </Transition>
              </>
            )}
          </Popover>
          <HeaderButton
            Icon={PlusIcon}
            label="Add Issue"
            onClick={() => {
              const e = new KeyboardEvent("keydown", {
                key: "i",
                ctrlKey: true,
              });
              document.dispatchEvent(e);
            }}
          />
        </div>
      }
    >
      <div className="flex h-full w-full flex-col space-y-5">
        {myIssues ? (
          <>
            {myIssues.length > 0 ? (
              <div className="flex flex-col space-y-5">
                <Disclosure as="div" defaultOpen>
                  {({ open }) => (
                    <div className="rounded-lg bg-white">
                      <div className="rounded-t-lg bg-gray-100 px-4 py-3">
                        <Disclosure.Button>
                          <div className="flex items-center gap-x-2">
                            <span>
                              <ChevronDownIcon
                                className={`h-4 w-4 text-gray-500 ${
                                  !open ? "-rotate-90 transform" : ""
                                }`}
                              />
                            </span>
                            <h2 className="font-medium leading-5">My Issues</h2>
                            <p className="text-sm text-gray-500">{myIssues.length}</p>
                          </div>
                        </Disclosure.Button>
                      </div>
                      <Transition
                        show={open}
                        enter="transition duration-100 ease-out"
                        enterFrom="transform opacity-0"
                        enterTo="transform opacity-100"
                        leave="transition duration-75 ease-out"
                        leaveFrom="transform opacity-100"
                        leaveTo="transform opacity-0"
                      >
                        <Disclosure.Panel>
                          <div className="divide-y-2">
                            {myIssues.map((issue: IIssue) => {
                              const assignees = [
                                ...(issue?.assignees_list ?? []),
                                ...(issue?.assignees ?? []),
                              ]?.map((assignee) => {
                                const tempPerson = people?.find(
                                  (p) => p.member.id === assignee
                                )?.member;

                                return {
                                  avatar: tempPerson?.avatar,
                                  first_name: tempPerson?.first_name,
                                  email: tempPerson?.email,
                                };
                              });

                              return (
                                <div
                                  key={issue.id}
                                  className="flex items-center justify-between gap-2 rounded px-4 py-3 text-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`block h-1.5 w-1.5 flex-shrink-0 rounded-full`}
                                      style={{
                                        backgroundColor: issue.state_detail.color,
                                      }}
                                    />
                                    <Link href={`/projects/${issue.project}/issues/${issue.id}`}>
                                      <a className="group relative flex items-center gap-2">
                                        <span>{issue.name}</span>
                                      </a>
                                    </Link>
                                  </div>
                                  <div className="flex flex-shrink-0 flex-wrap items-center gap-x-1 gap-y-2 text-xs">
                                    {properties.priority && (
                                      <Listbox
                                        as="div"
                                        value={issue.priority}
                                        className="group relative flex-shrink-0"
                                      >
                                        {({ open }) => (
                                          <>
                                            <div>
                                              <Listbox.Button
                                                className={`cursor-pointer rounded px-2 py-1 capitalize shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                                  issue.priority === "urgent"
                                                    ? "bg-red-100 text-red-600"
                                                    : issue.priority === "high"
                                                    ? "bg-orange-100 text-orange-500"
                                                    : issue.priority === "medium"
                                                    ? "bg-yellow-100 text-yellow-500"
                                                    : issue.priority === "low"
                                                    ? "bg-green-100 text-green-500"
                                                    : "bg-gray-100"
                                                }`}
                                              >
                                                {issue.priority ?? "None"}
                                              </Listbox.Button>

                                              <Transition
                                                show={open}
                                                as={React.Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                              >
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                  {PRIORITIES?.map((priority) => (
                                                    <Listbox.Option
                                                      key={priority}
                                                      className={({ active }) =>
                                                        classNames(
                                                          active ? "bg-indigo-50" : "bg-white",
                                                          "cursor-pointer select-none px-3 py-2 capitalize"
                                                        )
                                                      }
                                                      value={priority}
                                                    >
                                                      {priority}
                                                    </Listbox.Option>
                                                  ))}
                                                </Listbox.Options>
                                              </Transition>
                                            </div>
                                            <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                              <h5 className="mb-1 font-medium text-gray-900">
                                                Priority
                                              </h5>
                                              <div
                                                className={`capitalize ${
                                                  issue.priority === "urgent"
                                                    ? "text-red-600"
                                                    : issue.priority === "high"
                                                    ? "text-orange-500"
                                                    : issue.priority === "medium"
                                                    ? "text-yellow-500"
                                                    : issue.priority === "low"
                                                    ? "text-green-500"
                                                    : ""
                                                }`}
                                              >
                                                {issue.priority ?? "None"}
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </Listbox>
                                    )}
                                    {properties.state && (
                                      <Listbox
                                        as="div"
                                        value={issue.state}
                                        onChange={(data: string) => {
                                          // partialUpdateIssue({ state: data }, issue.id);
                                        }}
                                        className="group relative flex-shrink-0"
                                      >
                                        {({ open }) => (
                                          <>
                                            <div>
                                              <Listbox.Button className="flex cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                                <span
                                                  className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
                                                  style={{
                                                    backgroundColor: issue.state_detail.color,
                                                  }}
                                                ></span>
                                                {addSpaceIfCamelCase(issue.state_detail.name)}
                                              </Listbox.Button>

                                              <Transition
                                                show={open}
                                                as={React.Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                              >
                                                <Listbox.Options className="absolute z-10 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                  {states?.map((state) => (
                                                    <Listbox.Option
                                                      key={state.id}
                                                      className={({ active }) =>
                                                        classNames(
                                                          active ? "bg-indigo-50" : "bg-white",
                                                          "cursor-pointer select-none px-3 py-2"
                                                        )
                                                      }
                                                      value={state.id}
                                                    >
                                                      {addSpaceIfCamelCase(state.name)}
                                                    </Listbox.Option>
                                                  ))}
                                                </Listbox.Options>
                                              </Transition>
                                            </div>
                                            <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                              <h5 className="mb-1 font-medium">State</h5>
                                              <div>{issue.state_detail.name}</div>
                                            </div>
                                          </>
                                        )}
                                      </Listbox>
                                    )}
                                    {properties.start_date && (
                                      <div className="group relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500">
                                        <CalendarDaysIcon className="h-4 w-4" />
                                        {issue.start_date
                                          ? renderShortNumericDateFormat(issue.start_date)
                                          : "N/A"}
                                        <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                          <h5 className="mb-1 font-medium">Started at</h5>
                                          <div>
                                            {renderShortNumericDateFormat(issue.start_date ?? "")}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {properties.due_date && (
                                      <div
                                        className={`group group relative flex flex-shrink-0 cursor-pointer items-center gap-1 rounded border px-2 py-1 text-xs shadow-sm duration-300 hover:bg-gray-100 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                                          issue.target_date === null
                                            ? ""
                                            : issue.target_date < new Date().toISOString()
                                            ? "text-red-600"
                                            : findHowManyDaysLeft(issue.target_date) <= 3 &&
                                              "text-orange-400"
                                        }`}
                                      >
                                        <CalendarDaysIcon className="h-4 w-4" />
                                        {issue.target_date
                                          ? renderShortNumericDateFormat(issue.target_date)
                                          : "N/A"}
                                        <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                          <h5 className="mb-1 font-medium text-gray-900">
                                            Due date
                                          </h5>
                                          <div>
                                            {renderShortNumericDateFormat(issue.target_date ?? "")}
                                          </div>
                                          <div>
                                            {issue.target_date &&
                                              (issue.target_date < new Date().toISOString()
                                                ? `Due date has passed by ${findHowManyDaysLeft(
                                                    issue.target_date
                                                  )} days`
                                                : findHowManyDaysLeft(issue.target_date) <= 3
                                                ? `Due date is in ${findHowManyDaysLeft(
                                                    issue.target_date
                                                  )} days`
                                                : "Due date")}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                    {properties.assignee && (
                                      <Listbox
                                        as="div"
                                        value={issue.assignees}
                                        onChange={(data: any) => {
                                          const newData = issue.assignees ?? [];
                                          if (newData.includes(data)) {
                                            newData.splice(newData.indexOf(data), 1);
                                          } else {
                                            newData.push(data);
                                          }
                                          // partialUpdateIssue({ assignees_list: newData }, issue.id);
                                        }}
                                        className="group relative flex-shrink-0"
                                      >
                                        {({ open }) => (
                                          <>
                                            <div>
                                              <Listbox.Button>
                                                <div className="flex cursor-pointer items-center gap-1 text-xs">
                                                  {assignees.length > 0 ? (
                                                    assignees.map((assignee, index: number) => (
                                                      <div
                                                        key={index}
                                                        className={`relative z-[1] h-5 w-5 rounded-full ${
                                                          index !== 0 ? "-ml-2.5" : ""
                                                        }`}
                                                      >
                                                        {assignee.avatar &&
                                                        assignee.avatar !== "" ? (
                                                          <div className="h-5 w-5 rounded-full border-2 border-white bg-white">
                                                            <Image
                                                              src={assignee.avatar}
                                                              height="100%"
                                                              width="100%"
                                                              className="rounded-full"
                                                              alt={assignee?.first_name}
                                                            />
                                                          </div>
                                                        ) : (
                                                          <div
                                                            className={`grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-gray-700 text-white`}
                                                          >
                                                            {assignee.first_name?.charAt(0)}
                                                          </div>
                                                        )}
                                                      </div>
                                                    ))
                                                  ) : (
                                                    <div className="h-5 w-5 rounded-full border-2 border-white bg-white">
                                                      <Image
                                                        src={User}
                                                        height="100%"
                                                        width="100%"
                                                        className="rounded-full"
                                                        alt="No user"
                                                      />
                                                    </div>
                                                  )}
                                                </div>
                                              </Listbox.Button>

                                              <Transition
                                                show={open}
                                                as={React.Fragment}
                                                leave="transition ease-in duration-100"
                                                leaveFrom="opacity-100"
                                                leaveTo="opacity-0"
                                              >
                                                <Listbox.Options className="absolute right-0 z-10 mt-1 max-h-28 overflow-auto rounded-md bg-white py-1 text-xs shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                  {people?.map((person) => (
                                                    <Listbox.Option
                                                      key={person.id}
                                                      className={({ active }) =>
                                                        classNames(
                                                          active ? "bg-indigo-50" : "bg-white",
                                                          "cursor-pointer select-none p-2"
                                                        )
                                                      }
                                                      value={person.member.id}
                                                    >
                                                      <div
                                                        className={`flex items-center gap-x-1 ${
                                                          assignees.includes({
                                                            avatar: person.member.avatar,
                                                            first_name: person.member.first_name,
                                                            email: person.member.email,
                                                          })
                                                            ? "font-medium"
                                                            : "font-normal"
                                                        }`}
                                                      >
                                                        {person.member.avatar &&
                                                        person.member.avatar !== "" ? (
                                                          <div className="relative h-4 w-4">
                                                            <Image
                                                              src={person.member.avatar}
                                                              alt="avatar"
                                                              className="rounded-full"
                                                              layout="fill"
                                                              objectFit="cover"
                                                            />
                                                          </div>
                                                        ) : (
                                                          <div className="grid h-4 w-4 place-items-center rounded-full bg-gray-700 capitalize text-white">
                                                            {person.member.first_name &&
                                                            person.member.first_name !== ""
                                                              ? person.member.first_name.charAt(0)
                                                              : person.member.email.charAt(0)}
                                                          </div>
                                                        )}
                                                        <p>
                                                          {person.member.first_name &&
                                                          person.member.first_name !== ""
                                                            ? person.member.first_name
                                                            : person.member.email}
                                                        </p>
                                                      </div>
                                                    </Listbox.Option>
                                                  ))}
                                                </Listbox.Options>
                                              </Transition>
                                            </div>
                                            <div className="absolute bottom-full right-0 z-10 mb-2 hidden whitespace-nowrap rounded-md bg-white p-2 shadow-md group-hover:block">
                                              <h5 className="mb-1 font-medium">Assigned to</h5>
                                              <div>
                                                {issue.assignee_details?.length > 0
                                                  ? issue.assignee_details
                                                      .map((assignee) => assignee.first_name)
                                                      .join(", ")
                                                  : "No one"}
                                              </div>
                                            </div>
                                          </>
                                        )}
                                      </Listbox>
                                    )}
                                    <Menu as="div" className="relative">
                                      <Menu.Button
                                        as="button"
                                        className={`grid h-7 w-7 place-items-center rounded p-1 outline-none duration-300 hover:bg-gray-100`}
                                      >
                                        <EllipsisHorizontalIcon className="h-4 w-4" />
                                      </Menu.Button>
                                      <Menu.Items className="absolute right-0.5 z-10 mt-1 origin-top-right rounded-md bg-white p-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <Menu.Item>
                                          <button
                                            type="button"
                                            className="w-full whitespace-nowrap rounded-md p-2 text-left text-xs text-gray-900 hover:bg-theme hover:text-white"
                                            onClick={() => {
                                              // setSelectedIssue({
                                              //   ...issue,
                                              //   actionType: "edit",
                                              // });
                                            }}
                                          >
                                            Edit
                                          </button>
                                        </Menu.Item>
                                        <Menu.Item>
                                          <div className="border-b last:border-0 hover:bg-gray-100">
                                            <button
                                              type="button"
                                              className="w-full whitespace-nowrap rounded-md p-2 text-left text-xs text-gray-900 hover:bg-theme hover:text-white"
                                              onClick={() => {
                                                // handleDeleteIssue(issue.id);
                                              }}
                                            >
                                              Delete permanently
                                            </button>
                                          </div>
                                        </Menu.Item>
                                      </Menu.Items>
                                    </Menu>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </Disclosure.Panel>
                      </Transition>
                    </div>
                  )}
                </Disclosure>
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center px-4">
                <EmptySpace
                  title="You don't have any issue assigned to you yet."
                  description="Issues help you track individual pieces of work. With Issues, keep track of what's going on, who is working on it, and what's done."
                  Icon={RectangleStackIcon}
                >
                  <EmptySpaceItem
                    title="Create a new issue"
                    description={
                      <span>
                        Use{" "}
                        <pre className="inline rounded bg-gray-100 px-2 py-1">Ctrl/Command + I</pre>{" "}
                        shortcut to create a new issue
                      </span>
                    }
                    Icon={PlusIcon}
                    action={() => {
                      const e = new KeyboardEvent("keydown", {
                        key: "i",
                        ctrlKey: true,
                      });
                      document.dispatchEvent(e);
                    }}
                  />
                </EmptySpace>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export const getServerSideProps = async (ctx: NextPageContext) => {
  const user = await requiredAuth(ctx.req?.headers.cookie);

  const redirectAfterSignIn = ctx.req?.url;

  if (!user) {
    return {
      redirect: {
        destination: `/signin?next=${redirectAfterSignIn}`,
        permanent: false,
      },
    };
  }

  return {
    props: {
      user,
    },
  };
};

export default MyIssues;
