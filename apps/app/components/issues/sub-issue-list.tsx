import { FC, useState } from "react";
import Link from "next/link";
import { Disclosure, Transition } from "@headlessui/react";
import { ChevronRightIcon, PlusIcon } from "@heroicons/react/24/outline";
// components
import { CustomMenu } from "components/ui";
import { CreateUpdateIssueModal } from "components/issues";
import AddAsSubIssue from "components/project/issues/issue-detail/add-as-sub-issue";
// types
import { IIssue } from "types";

export interface SubIssueListProps {
  issues: IIssue[];
  projectId: string;
  workspaceSlug: string;
  parentIssue: IIssue;
  handleSubIssueRemove: (subIssueId: string) => void;
}

export const SubIssueList: FC<SubIssueListProps> = ({
  issues = [],
  handleSubIssueRemove,
  parentIssue,
  workspaceSlug,
  projectId,
}) => {
  // states
  const [isIssueModalActive, setIssueModalActive] = useState(false);
  const [isSubIssueModalActive, setSubIssueModalActive] = useState(false);
  const [preloadedData, setPreloadedData] = useState<Partial<IIssue> | null>(null);

  const openIssueModal = () => {
    setIssueModalActive(true);
  };

  const closeIssueModal = () => {
    setIssueModalActive(false);
  };

  const openSubIssueModal = () => {
    setSubIssueModalActive(true);
  };

  const closeSubIssueModal = () => {
    setSubIssueModalActive(false);
  };

  return (
    <>
      <CreateUpdateIssueModal
        isOpen={isIssueModalActive}
        prePopulateData={{ ...preloadedData }}
        handleClose={closeIssueModal}
      />
      <AddAsSubIssue
        isOpen={isSubIssueModalActive}
        setIsOpen={setSubIssueModalActive}
        parent={parentIssue}
      />
      {parentIssue?.id && workspaceSlug && projectId && issues?.length > 0 ? (
        <Disclosure defaultOpen={true}>
          {({ open }) => (
            <>
              <div className="flex items-center justify-between">
                <Disclosure.Button className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-gray-100">
                  <ChevronRightIcon className={`h-3 w-3 ${open ? "rotate-90" : ""}`} />
                  Sub-issues <span className="ml-1 text-gray-600">{issues.length}</span>
                </Disclosure.Button>
                {open ? (
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-gray-100"
                      onClick={() => {
                        openIssueModal();
                        setPreloadedData({
                          parent: parentIssue.id,
                        });
                      }}
                    >
                      <PlusIcon className="h-3 w-3" />
                      Create new
                    </button>

                    <CustomMenu ellipsis>
                      <CustomMenu.MenuItem
                        onClick={() => {
                          setSubIssueModalActive(true);
                        }}
                      >
                        Add an existing issue
                      </CustomMenu.MenuItem>
                    </CustomMenu>
                  </div>
                ) : null}
              </div>
              <Transition
                enter="transition duration-100 ease-out"
                enterFrom="transform scale-95 opacity-0"
                enterTo="transform scale-100 opacity-100"
                leave="transition duration-75 ease-out"
                leaveFrom="transform scale-100 opacity-100"
                leaveTo="transform scale-95 opacity-0"
              >
                <Disclosure.Panel className="mt-3 flex flex-col gap-y-1">
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      className="group flex items-center justify-between gap-2 rounded p-2 hover:bg-gray-100"
                    >
                      <Link href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.id}`}>
                        <a className="flex items-center gap-2 rounded text-xs">
                          <span
                            className={`block h-1.5 w-1.5 rounded-full`}
                            style={{
                              backgroundColor: issue.state_detail.color,
                            }}
                          />
                          <span className="flex-shrink-0 text-gray-600">
                            {issue.project_detail.identifier}-{issue.sequence_id}
                          </span>
                          <span className="max-w-sm break-all font-medium">{issue.name}</span>
                        </a>
                      </Link>
                      <div className="opacity-0 group-hover:opacity-100">
                        <CustomMenu ellipsis>
                          <CustomMenu.MenuItem onClick={() => handleSubIssueRemove(issue.id)}>
                            Remove as sub-issue
                          </CustomMenu.MenuItem>
                        </CustomMenu>
                      </div>
                    </div>
                  ))}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      ) : (
        <CustomMenu
          label={
            <>
              <PlusIcon className="h-3 w-3" />
              Add sub-issue
            </>
          }
          optionsPosition="left"
          noBorder
        >
          <CustomMenu.MenuItem
            onClick={() => {
              openIssueModal();
            }}
          >
            Create new
          </CustomMenu.MenuItem>
          <CustomMenu.MenuItem
            onClick={() => {
              openSubIssueModal();
            }}
          >
            Add an existing issue
          </CustomMenu.MenuItem>
        </CustomMenu>
      )}
    </>
  );
};
