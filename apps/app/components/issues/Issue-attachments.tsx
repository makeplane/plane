import useSWR, { mutate } from "swr";

import { useRouter } from "next/router";

// toast
import useToast from "hooks/use-toast";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
import { CsvIcon, ExcelIcon, PdfIcon } from "components/icons";
// services
import fileServices from "services/file.service";
// fetch-key
import { ISSUE_ATTACHMENTS } from "constants/fetch-keys";

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

  console.log("attachments : ", attachments);
  return (
    <>
      {attachments &&
        attachments.length > 0 &&
        attachments.map((a: any) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-1 px-4 py-1.5 text-xs border border-gray-200 bg-white rounded-md"
          >
            <div className="flex items-center gap-2">
              <div className="h-7 w-6">{getFileIcon(getFileExtension(a.asset))}</div>

              <div className="flex flex-col gap-0.5">
                <span>{extractFileNameWithExtension(a.attributes.name)}</span>
                <div className="flex items-center gap-3 text-gray-500">
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
