import React from "react";

import { useRouter } from "next/router";

// headless ui
import { Disclosure, Popover, Transition } from "@headlessui/react";
// icons
import { ChevronDownIcon, PlusIcon } from "@heroicons/react/24/outline";
// images
import emptyMyIssues from "public/empty-state/my-issues.svg";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// hooks
import useIssues from "hooks/use-issues";
// ui
import { Spinner, PrimaryButton, EmptyState } from "components/ui";
import { Breadcrumbs, BreadcrumbItem } from "components/breadcrumbs";
// hooks
import useMyIssuesProperties from "hooks/use-my-issues-filter";
// types
import { IIssue, Properties } from "types";
// components
import { MyIssuesListItem } from "components/issues";
// helpers
import { replaceUnderscoreIfSnakeCase } from "helpers/string.helper";
// types
import type { NextPage } from "next";
import useProjects from "hooks/use-projects";

const MyIssuesPage: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { myIssues } = useIssues(workspaceSlug as string);
  const { projects } = useProjects();

  const [properties, setProperties] = useMyIssuesProperties(workspaceSlug as string);

  return (
    <WorkspaceAuthorizationLayout
      breadcrumbs={
        <Breadcrumbs>
          <BreadcrumbItem title="My Issues" />
        </Breadcrumbs>
      }
      right={
        <div className="flex items-center gap-2">
          {myIssues && myIssues.length > 0 && (
            <Popover className="relative">
              {({ open }) => (
                <>
                  <Popover.Button
                    className={`group flex items-center gap-2 rounded-md border border-custom-border-200 bg-transparent px-3 py-1.5 text-xs hover:bg-custom-background-90 hover:text-custom-text-100 focus:outline-none ${
                      open ? "bg-custom-background-90 text-custom-text-100" : "text-custom-text-200"
                    }`}
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
                    <Popover.Panel className="absolute right-1/2 z-10 mr-5 mt-1 w-screen max-w-xs translate-x-1/2 transform overflow-hidden rounded-lg bg-custom-background-100 p-3 shadow-lg">
                      <div className="space-y-2 py-3">
                        <h4 className="text-sm text-custom-text-200">Properties</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          {Object.keys(properties).map((key) => {
                            if (key === "estimate") return null;

                            return (
                              <button
                                key={key}
                                type="button"
                                className={`rounded border px-2 py-1 text-xs capitalize ${
                                  properties[key as keyof Properties]
                                    ? "border-custom-primary bg-custom-primary text-white"
                                    : "border-custom-border-200"
                                }`}
                                onClick={() => setProperties(key as keyof Properties)}
                              >
                                {key === "key" ? "ID" : replaceUnderscoreIfSnakeCase(key)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </Popover.Panel>
                  </Transition>
                </>
              )}
            </Popover>
          )}
          <PrimaryButton
            className="flex items-center gap-2"
            onClick={() => {
              const e = new KeyboardEvent("keydown", { key: "c" });
              document.dispatchEvent(e);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Add Issue
          </PrimaryButton>
        </div>
      }
    >
      <div className="flex h-full w-full flex-col space-y-5">
        {myIssues ? (
          <>
            {myIssues.length > 0 ? (
              <Disclosure as="div" defaultOpen>
                {({ open }) => (
                  <div>
                    <div className="flex items-center px-4 py-2.5 bg-custom-background-90">
                      <Disclosure.Button>
                        <div className="flex items-center gap-x-2">
                          <h2 className="font-medium leading-5">My Issues</h2>
                          <span className="rounded-full bg-custom-background-80 py-0.5 px-3 text-sm text-custom-text-200">
                            {myIssues.length}
                          </span>
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
                        {myIssues.map((issue: IIssue) => (
                          <MyIssuesListItem
                            key={issue.id}
                            issue={issue}
                            properties={properties}
                            projectId={issue.project}
                          />
                        ))}
                      </Disclosure.Panel>
                    </Transition>
                  </div>
                )}
              </Disclosure>
            ) : (
              <EmptyState
                title={
                  projects
                    ? projects.length > 0
                      ? "You don't have any issue assigned to you yet"
                      : "Issues assigned to you will appear here"
                    : ""
                }
                description={
                  projects
                    ? projects.length > 0
                      ? "Keep track of your work in a single place."
                      : "Let's create your first project and add issues that you want to accomplish."
                    : ""
                }
                image={emptyMyIssues}
                buttonText={projects ? (projects.length > 0 ? "New Issue" : "New Project") : ""}
                buttonIcon={<PlusIcon className="h-4 w-4" />}
                onClick={() => {
                  let e: KeyboardEvent;

                  if (projects && projects.length > 0)
                    e = new KeyboardEvent("keydown", {
                      key: "c",
                    });
                  else
                    e = new KeyboardEvent("keydown", {
                      key: "p",
                    });

                  document.dispatchEvent(e);
                }}
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Spinner />
          </div>
        )}
      </div>
    </WorkspaceAuthorizationLayout>
  );
};

export default MyIssuesPage;
