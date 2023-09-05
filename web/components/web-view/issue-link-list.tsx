// react
import React, { useState } from "react";

// next
import Link from "next/link";

// icons
import { LinkIcon, PlusIcon } from "@heroicons/react/24/outline";

// components
import { Label, WebViewModal, CreateUpdateLinkForm } from "components/web-view";

// ui
import { SecondaryButton } from "components/ui";

// types
import type { linkDetails } from "types";

type Props = {
  allowed: boolean;
  links?: linkDetails[];
};

export const IssueLinks: React.FC<Props> = (props) => {
  const { links, allowed } = props;

  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <WebViewModal isOpen={isOpen} onClose={() => setIsOpen(false)} modalTitle="Add Link">
        <CreateUpdateLinkForm links={links} onSuccess={() => setIsOpen(false)} />
      </WebViewModal>

      <Label>Attachments</Label>
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
