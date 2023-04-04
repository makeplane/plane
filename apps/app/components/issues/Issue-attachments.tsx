import { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

import useSWR from "swr";

// ui
import { Tooltip } from "components/ui";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CsvIcon, ExcelIcon, ExclamationIcon, PdfIcon } from "components/icons";
// services
import fileServices from "services/file.service";
import projectService from "services/project.service";
// fetch-key
import { ISSUE_ATTACHMENTS, PROJECT_MEMBERS } from "constants/fetch-keys";
// helper
import { truncateText } from "helpers/string.helper";
import { formatDateLong } from "helpers/date-time.helper";
import { DeleteAttachmentModal } from "./delete-attachment-modal";
import { IIssueAttachment } from "types";

export const IssueAttachments = () => {
  const [deleteAttachment, setDeleteAttachment] = useState<IIssueAttachment | null>(null);
  const [attachmentDeleteModal, setAttachmentDeleteModal] = useState<boolean>(false);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { data: attachments } = useSWR<IIssueAttachment[]>(
    workspaceSlug && projectId && issueId ? ISSUE_ATTACHMENTS(issueId as string) : null,
    workspaceSlug && projectId && issueId
      ? () =>
          fileServices.getIssueAttachment(
            workspaceSlug as string,
            projectId as string,
            issueId as string
          )
      : null
  );

  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const getFileExtension = (filename: string) =>
    filename.slice(((filename.lastIndexOf(".") - 1) >>> 0) + 2);

  const extractFileNameWithExtension = (fileName: string) => {
    const dotIndex = fileName.lastIndexOf(".");

    const nameWithoutExtension = fileName.substring(0, dotIndex);

    return nameWithoutExtension;
  };

  const convertBytesToSize = (bytes: number) => {
    let size;

    if (bytes < 1024 * 1024) {
      size = Math.round(bytes / 1024) + " KB";
    } else {
      size = Math.round(bytes / (1024 * 1024)) + " MB";
    }

    return size;
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <PdfIcon />;

      case "csv":
        return <CsvIcon />;

      case "xlsx":
        return <ExcelIcon />;

      default:
        return <PdfIcon />;
    }
  };

  return (
    <>
      <DeleteAttachmentModal
        isOpen={attachmentDeleteModal}
        setIsOpen={setAttachmentDeleteModal}
        data={deleteAttachment}
      />
      {attachments &&
        attachments.length > 0 &&
        attachments.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-1 px-4 py-2 text-sm border border-gray-200 bg-white rounded-md"
          >
            <Link href={a.asset}>
              <a target="_blank">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-6">{getFileIcon(getFileExtension(a.asset))}</div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <Tooltip
                        theme="dark"
                        tooltipContent={extractFileNameWithExtension(a.attributes.name)}
                      >
                        <span className="text-sm">
                          {truncateText(`${extractFileNameWithExtension(a.attributes.name)}`, 10)}
                        </span>
                      </Tooltip>
                      <Tooltip
                        theme="dark"
                        tooltipContent={`${
                          people?.find((person) => person.member.id === a.updated_by)?.member
                            .first_name ?? ""
                        } uploaded on ${formatDateLong(a.updated_at)}`}
                      >
                        <span>
                          <ExclamationIcon className="h-4 w-4" />
                        </span>
                      </Tooltip>
                    </div>

                    <div className="flex items-center gap-3 text-gray-500 text-xs">
                      <span>{getFileExtension(a.asset).toUpperCase()}</span>
                      <span>{convertBytesToSize(a.attributes.size)}</span>
                    </div>
                  </div>
                </div>
              </a>
            </Link>

            <button
              onClick={() => {
                setDeleteAttachment(a);
                setAttachmentDeleteModal(true);
              }}
            >
              <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-gray-800" />
            </button>
          </div>
        ))}
    </>
  );
};
