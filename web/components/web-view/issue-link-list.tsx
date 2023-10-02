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
// import { LinkIcon, PlusIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Link as LinkIcon, Plus, Pencil, X } from "lucide-react";

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

type DeleteConfirmationProps = {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = (props) => {
  const { isOpen, onCancel, onConfirm } = props;

  return (
    <WebViewModal isOpen={isOpen} onClose={onCancel} modalTitle="Delete Link">
      <div className="text-custom-text-200">
        <p>Are you sure you want to delete this link?</p>
      </div>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="w-full py-2 flex items-center justify-center rounded-[4px] bg-red-500/10 text-red-500 border border-red-500 text-base font-medium"
        >
          Delete
        </button>
      </div>
    </WebViewModal>
  );
};

export const IssueLinks: React.FC<Props> = (props) => {
  const { issueDetails, allowed } = props;

  const links = issueDetails?.issue_link;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [deleteSelected, setDeleteSelected] = useState<string | null>(null);

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
      .then(() => {
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

      <DeleteConfirmation
        isOpen={!!deleteSelected}
        onCancel={() => setDeleteSelected(null)}
        onConfirm={() => {
          if (!deleteSelected) return;
          handleDeleteLink(deleteSelected);
          setDeleteSelected(null);
        }}
      />

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
                <span>{link.title || link.metadata?.title || link.url}</span>
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
                  <Pencil className="w-[18px] h-[18px] text-custom-text-400" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteSelected(link.id);
                  }}
                >
                  <X className="w-[18px] h-[18px] text-custom-text-400" />
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
          <Plus className="w-[18px] h-[18px] inline-block mr-1" />
          <span>Add</span>
        </SecondaryButton>
      </div>
    </div>
  );
};
