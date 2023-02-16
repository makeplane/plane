import { FC, useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import { mutate } from "swr";

// headless ui
import { Disclosure, Transition } from "@headlessui/react";
// services
import issuesService from "services/issues.service";
// hooks
import useToast from "hooks/use-toast";
// components
import { LinkModal } from "components/core";
// ui
import { CustomMenu } from "components/ui";
// icons
import { ChevronRightIcon, LinkIcon, PlusIcon } from "@heroicons/react/24/outline";
// helpers
import { copyTextToClipboard } from "helpers/string.helper";
import { timeAgo } from "helpers/date-time.helper";
// types
import { IIssue, IIssueLink, UserAuth } from "types";
// fetch-keys
import { ISSUE_DETAILS } from "constants/fetch-keys";

type Props = {
  parentIssue: IIssue;
  userAuth: UserAuth;
};

export const LinksList: FC<Props> = ({ parentIssue, userAuth }) => {
  const [linkModal, setLinkModal] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { setToastAlert } = useToast();

  const handleCreateLink = async (formData: IIssueLink) => {
    if (!workspaceSlug || !projectId || !parentIssue) return;

    const previousLinks = parentIssue?.issue_link.map((l) => ({ title: l.title, url: l.url }));

    const payload: Partial<IIssue> = {
      links_list: [...(previousLinks ?? []), formData],
    };

    await issuesService
      .patchIssue(workspaceSlug as string, projectId as string, parentIssue.id, payload)
      .then((res) => {
        mutate(ISSUE_DETAILS(parentIssue.id as string));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !parentIssue) return;

    const updatedLinks = parentIssue.issue_link.filter((l) => l.id !== linkId);

    mutate<IIssue>(
      ISSUE_DETAILS(parentIssue.id as string),
      (prevData) => ({ ...(prevData as IIssue), issue_link: updatedLinks }),
      false
    );

    await issuesService
      .patchIssue(workspaceSlug as string, projectId as string, parentIssue.id, {
        links_list: updatedLinks,
      })
      .then((res) => {
        mutate(ISSUE_DETAILS(parentIssue.id as string));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <>
      <LinkModal
        isOpen={linkModal}
        handleClose={() => setLinkModal(false)}
        onFormSubmit={handleCreateLink}
      />
      {parentIssue.issue_link && parentIssue.issue_link.length > 0 ? (
        <Disclosure defaultOpen={true}>
          {({ open }) => (
            <>
              <div className="flex items-center justify-between">
                <Disclosure.Button className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-gray-100">
                  <ChevronRightIcon className={`h-3 w-3 ${open ? "rotate-90" : ""}`} />
                  Links <span className="ml-1 text-gray-600">{parentIssue.issue_link.length}</span>
                </Disclosure.Button>
                {open && !isNotAllowed ? (
                  <div className="flex items-center">
                    <button
                      type="button"
                      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium hover:bg-gray-100"
                      onClick={() => setLinkModal(true)}
                    >
                      <PlusIcon className="h-3 w-3" />
                      Create new
                    </button>
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
                  {parentIssue.issue_link.map((link) => (
                    <div
                      key={link.id}
                      className="group flex items-center justify-between gap-2 rounded p-2 hover:bg-gray-100"
                    >
                      <Link href={link.url}>
                        <a className="flex items-center gap-2 rounded text-xs">
                          <LinkIcon className="h-3 w-3" />
                          <span className="max-w-sm break-all font-medium">{link.title}</span>
                          <span className="text-gray-400 text-[0.65rem]">
                            {timeAgo(link.created_at)}
                          </span>
                        </a>
                      </Link>
                      {!isNotAllowed && (
                        <div className="opacity-0 group-hover:opacity-100">
                          <CustomMenu ellipsis>
                            <CustomMenu.MenuItem
                              onClick={() =>
                                copyTextToClipboard(link.url).then(() => {
                                  setToastAlert({
                                    type: "success",
                                    title: "Link copied to clipboard",
                                  });
                                })
                              }
                            >
                              Copy link
                            </CustomMenu.MenuItem>
                            <CustomMenu.MenuItem onClick={() => handleDeleteLink(link.id)}>
                              Remove link
                            </CustomMenu.MenuItem>
                          </CustomMenu>
                        </div>
                      )}
                    </div>
                  ))}
                </Disclosure.Panel>
              </Transition>
            </>
          )}
        </Disclosure>
      ) : (
        !isNotAllowed && (
          <button
            type="button"
            className="flex cursor-pointer items-center justify-between gap-1 px-2 py-1 text-xs rounded duration-300 hover:bg-gray-100"
            onClick={() => setLinkModal(true)}
          >
            <PlusIcon className="h-3 w-3" />
            Add new link
          </button>
        )
      )}
    </>
  );
};
