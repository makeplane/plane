import useSWR, { mutate } from "swr";

import { useRouter } from "next/router";

// toast
import useToast from "hooks/use-toast";
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

export const IssueAttachments = () => {
  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { setToastAlert } = useToast();

  const { data: attachments } = useSWR(
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

  const handleDelete = (assetId: string) => {
    if (!assetId || !workspaceSlug) return;

    fileServices
      .deleteIssueAttachment(
        workspaceSlug as string,
        projectId as string,
        issueId as string,
        assetId as string
      )
      .then((res) => {
        mutate(ISSUE_ATTACHMENTS(issueId as string));
        setToastAlert({
          type: "success",
          title: "Success!",
          message: "File removed successfully.",
        });
      })
      .catch((err) => {
        setToastAlert({
          type: "error",
          title: "error!",
          message: "Something went wrong please try again.",
        });
      });
  };

  return (
    <>
      {attachments &&
        attachments.length > 0 &&
        attachments.map((a: any) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-1 px-4 py-1.5 text-sm border border-gray-200 bg-white rounded-md"
          >
            <div className="flex items-center gap-3">
              <div className="h-7 w-6">{getFileIcon(getFileExtension(a.asset))}</div>

              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <Tooltip tooltipContent={extractFileNameWithExtension(a.attributes.name)}>
                    <span className="text-sm">
                      {truncateText(`${extractFileNameWithExtension(a.attributes.name)}`, 10)}
                    </span>
                  </Tooltip>
                  <Tooltip
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

            <button onClick={() => handleDelete(a.id)}>
              <XMarkIcon className="h-4 w-4 text-gray-500 hover:text-gray-800" />
            </button>
          </div>
        ))}
    </>
  );
};
