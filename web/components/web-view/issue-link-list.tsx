// react
import React, { useState } from "react";

// next
import Link from "next/link";
import { useRouter } from "next/router";

// swr
import { mutate } from "swr";

// services
import issuesService from "services/issues.service";

// icons
import { LinkIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";

// components
import { Label, WebViewModal, CreateUpdateLinkForm } from "components/web-view";

// ui
import { SecondaryButton } from "components/ui";

// fetch keys
import { ISSUE_DETAILS } from "constants/fetch-keys";

// types
import type { IIssue } from "types";

type Props = {
  allowed: boolean;
  issueDetails: IIssue;
};

export const IssueLinks: React.FC<Props> = (props) => {
  const { issueDetails, allowed } = props;

  const links = issueDetails?.issue_link;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !issueDetails) return;

    const updatedLinks = issueDetails.issue_link.filter((l) => l.id !== linkId);

    mutate<IIssue>(
      ISSUE_DETAILS(issueDetails.id),
      (prevData) => ({ ...(prevData as IIssue), issue_link: updatedLinks }),
      false
    );

    await issuesService
      .deleteIssueLink(workspaceSlug as string, projectId as string, issueDetails.id, linkId)
      .then((res) => {
        mutate(ISSUE_DETAILS(issueDetails.id));
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div>
      <WebViewModal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setSelectedLink(null);
        }}
        modalTitle={selectedLink ? "Update Link" : "Add Link"}
      >
        <CreateUpdateLinkForm
          isOpen={isOpen}
          links={links}
          onSuccess={() => {
            setIsOpen(false);
            setSelectedLink(null);
          }}
          data={links?.find((link) => link.id === selectedLink)}
        />
      </WebViewModal>

      <Label>Links</Label>
      <div className="mt-1 space-y-[6px]">
        {links?.map((link) => (
          <div
            key={link.id}
            className="px-3 border border-custom-border-200 rounded-[4px] py-2 flex justify-between items-center bg-custom-background-100"
          >
            <Link href={link.url}>
              <a target="_blank" className="text-custom-text-200 truncate">
                <span>
                  <LinkIcon className="w-4 h-4 inline-block mr-1" />
                </span>
                <span>{link.title}</span>
              </a>
            </Link>
            {allowed && (
              <div className="flex gap-2 items-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(true);
                    setSelectedLink(link.id);
                  }}
                >
                  <PencilIcon className="w-5 h-5 text-custom-text-100" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleDeleteLink(link.id);
                  }}
                >
                  <TrashIcon className="w-5 h-5 text-red-500 hover:bg-red-500/20" />
                </button>
              </div>
            )}
          </div>
        ))}
        <SecondaryButton
          type="button"
          disabled={!allowed}
          onClick={() => setIsOpen(true)}
          className="w-full !py-2 text-custom-text-300 !text-base flex items-center justify-center"
        >
          <PlusIcon className="w-4 h-4 inline-block mr-1" />
          <span>Add</span>
        </SecondaryButton>
      </div>
    </div>
  );
};
