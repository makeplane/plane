import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

// ui
import { Tooltip } from "@plane/ui";
import { DeleteAttachmentModal } from "./delete-attachment-modal";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
import { ExclamationIcon, getFileIcon } from "components/icons";
// services
import { IssueAttachmentService } from "services/issue";
import { ProjectService } from "services/project";
// fetch-key
import { ISSUE_ATTACHMENTS, PROJECT_MEMBERS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";
import { renderLongDateFormat } from "helpers/date-time.helper";
import { convertBytesToSize, getFileExtension, getFileName } from "helpers/attachment.helper";
// type
import { IIssueAttachment } from "types";

// services
const issueAttachmentService = new IssueAttachmentService();
const projectService = new ProjectService();

export const IssueAttachments = () => {
  const [deleteAttachment, setDeleteAttachment] = useState<IIssueAttachment | null>(null);
  const [attachmentDeleteModal, setAttachmentDeleteModal] = useState<boolean>(false);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: attachments } = useSWR<IIssueAttachment[]>(
    workspaceSlug && projectId && issueId ? ISSUE_ATTACHMENTS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () => issueAttachmentService.getIssueAttachment(workspaceSlug as string, projectId as string, issueId as string)
      : null
  );

  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  return (
    <>
      <DeleteAttachmentModal
        isOpen={attachmentDeleteModal}
        setIsOpen={setAttachmentDeleteModal}
        data={deleteAttachment}
      />
      {attachments &&
        attachments.length > 0 &&
        attachments.map((file) => (
          <div
            key={file.id}
            className="flex h-[60px] items-center justify-between gap-1 rounded-md border-[2px] border-custom-border-200 bg-custom-background-100 px-4 py-2 text-sm"
          >
            <Link href={file.asset}>
              <a target="_blank">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7">{getFileIcon(getFileExtension(file.asset))}</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Tooltip tooltipContent={getFileName(file.attributes.name)}>
                        <span className="text-sm">{truncateText(`${getFileName(file.attributes.name)}`, 10)}</span>
                      </Tooltip>
                      <Tooltip
                        tooltipContent={`${
                          people?.find((person) => person.member.id === file.updated_by)?.member.display_name ?? ""
                        } uploaded on ${renderLongDateFormat(file.updated_at)}`}
                      >
                        <span>
                          <ExclamationIcon className="h-3 w-3 fill-current" />
                        </span>
                      </Tooltip>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-custom-text-200">
                      <span>{getFileExtension(file.asset).toUpperCase()}</span>
                      <span>{convertBytesToSize(file.attributes.size)}</span>
                    </div>
                  </div>
                </div>
              </a>
            </Link>

            <button
              onClick={() => {
                setDeleteAttachment(file);
                setAttachmentDeleteModal(true);
              }}
            >
              <XMarkIcon className="h-4 w-4 text-custom-text-200 hover:text-custom-text-100" />
            </button>
          </div>
        ))}
    </>
  );
};
