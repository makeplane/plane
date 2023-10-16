import React, { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
// services
import { IssueService } from "services/issue";
// icons
import { Link as LinkIcon, Plus, Pencil, X } from "lucide-react";
// components
import { Label, WebViewModal, CreateUpdateLinkForm, DeleteConfirmation } from "components/web-view";
// ui
import { Button } from "@plane/ui";
// fetch keys
import { ISSUE_DETAILS } from "constants/fetch-keys";
// types
import type { IIssue } from "types";

type Props = {
  allowed: boolean;
  issueDetails: IIssue;
};

const issueService = new IssueService();

export const IssueLinks: React.FC<Props> = (props) => {
  const { issueDetails, allowed } = props;

  const links = issueDetails?.issue_link;

  const [isOpen, setIsOpen] = useState(false);
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [deleteSelected, setDeleteSelected] = useState<string | null>(null);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const handleDeleteLink = async (linkId: string) => {
    if (!workspaceSlug || !projectId || !issueDetails || !allowed) return;

    const updatedLinks = issueDetails.issue_link.filter((l) => l.id !== linkId);

    mutate<IIssue>(
      ISSUE_DETAILS(issueDetails.id),
      (prevData) => ({ ...(prevData as IIssue), issue_link: updatedLinks }),
      false
    );

    await issueService
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
        title="Delete Link"
        content="Are you sure you want to delete this link?"
        isOpen={!!deleteSelected}
        onCancel={() => setDeleteSelected(null)}
        onConfirm={() => {
          if (!deleteSelected || !allowed) return;
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
            <button
              type="button"
              onClick={() => {
                console.log("link", link.url);
              }}
              className="text-custom-text-200 truncate"
            >
              <span>
                <LinkIcon className="w-4 h-4 inline-block mr-1" />
              </span>
              <span>{link.title || link.metadata?.title || link.url}</span>
            </button>
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
        <Button variant="neutral-primary" prependIcon={<Plus />} disabled={!allowed} onClick={() => setIsOpen(true)}>
          Add
        </Button>
      </div>
    </div>
  );
};
