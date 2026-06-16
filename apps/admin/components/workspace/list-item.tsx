import { useState } from "react";
import { observer } from "mobx-react";

// plane internal packages
import { WEB_BASE_URL } from "@plane/constants";
import { NewTabIcon } from "@plane/propel/icons";
import { Tooltip } from "@plane/propel/tooltip";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { getFileURL } from "@plane/utils";
// hooks
import { useWorkspace } from "@/hooks/store";

type TWorkspaceListItemProps = {
  workspaceId: string;
};

// Delete confirmation modal
const DeleteWorkspaceModal = ({
  workspaceName,
  onClose,
  onConfirm,
  isDeleting,
}: {
  workspaceName: string;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
    <div className="bg-layer-1 rounded-xl border border-subtle shadow-2xl w-full max-w-md mx-4">
      <div className="px-5 py-4 border-b border-subtle">
        <h3 className="text-16 font-semibold text-primary">Delete Workspace</h3>
      </div>
      <div className="px-5 py-4">
        <p className="text-14 text-secondary leading-relaxed">
          Are you sure you want to delete <strong className="text-primary">{workspaceName}</strong>?
          This is permanent and cannot be undone. All projects, issues, members, and data in this
          workspace will be permanently deleted.
        </p>
      </div>
      <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-subtle">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="px-4 py-2 text-13 font-medium rounded-lg border border-subtle text-secondary hover:bg-layer-1-hover transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isDeleting}
          className="px-4 py-2 text-13 font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "Delete Workspace"}
        </button>
      </div>
    </div>
  </div>
);

export const WorkspaceListItem = observer(function WorkspaceListItem({ workspaceId }: TWorkspaceListItemProps) {
  // store hooks
  const { getWorkspaceById, deleteWorkspace } = useWorkspace();
  // derived values
  const workspace = getWorkspaceById(workspaceId);
  // local state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!workspace) return null;

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteWorkspace(workspaceId, workspace.slug);
      setShowDeleteModal(false);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Workspace deleted",
        message: `Workspace '${workspace.name}' has been permanently deleted.`,
      });
    } catch (error: any) {
      const msg = error?.error || error?.detail || "Failed to delete workspace.";
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Delete failed",
        message: msg,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div
        className="group flex items-center justify-between gap-2.5 truncate rounded-lg border border-subtle bg-layer-1 p-3 hover:border-subtle-1 hover:bg-layer-1-hover hover:shadow-raised-100"
      >
        <a
          href={`${WEB_BASE_URL}/${encodeURIComponent(workspace.slug)}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-4 flex-1 min-w-0"
        >
          <span
            className={`relative mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center p-2 text-11 uppercase ${
              !workspace?.logo_url && "rounded-lg bg-accent-primary text-on-color"
            }`}
          >
            {workspace?.logo_url && workspace.logo_url !== "" ? (
              <img
                src={getFileURL(workspace.logo_url)}
                className="absolute top-0 left-0 h-full w-full rounded-sm object-cover"
                alt="Workspace Logo"
              />
            ) : (
              (workspace?.name?.[0] ?? "...")
            )}
          </span>
          <div className="flex flex-col items-start gap-1 min-w-0">
            <div className="flex w-full flex-wrap items-center gap-2.5">
              <h3 className={`text-14 font-medium capitalize`}>{workspace.name}</h3>/
              <Tooltip tooltipContent="The unique URL of your workspace">
                <h4 className="text-13 text-tertiary">[{workspace.slug}]</h4>
              </Tooltip>
            </div>
            {workspace.owner.email && (
              <div className="flex items-center gap-1 text-11">
                <h3 className="font-medium text-secondary">Owned by:</h3>
                <h4 className="text-tertiary">{workspace.owner.email}</h4>
              </div>
            )}
            <div className="flex items-center gap-2.5 text-11">
              {workspace.total_projects !== null && (
                <span className="flex items-center gap-1">
                  <h3 className="font-medium text-secondary">Total projects:</h3>
                  <h4 className="text-tertiary">{workspace.total_projects}</h4>
                </span>
              )}
              {workspace.total_members !== null && (
                <>
                  •
                  <span className="flex items-center gap-1">
                    <h3 className="font-medium text-secondary">Total members:</h3>
                    <h4 className="text-tertiary">{workspace.total_members}</h4>
                  </span>
                </>
              )}
            </div>
          </div>
        </a>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Redirect button */}
          <a
            href={`${WEB_BASE_URL}/${encodeURIComponent(workspace.slug)}`}
            target="_blank"
            rel="noreferrer"
            className="p-1.5 rounded hover:bg-layer-2 transition-colors"
            title="Open workspace"
          >
            <NewTabIcon width={14} height={16} className="text-placeholder group-hover:text-secondary" />
          </a>
          {/* Delete button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteModal(true);
            }}
            className="p-1.5 rounded hover:bg-red-100 transition-colors"
            title="Delete workspace"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-400 group-hover:text-red-500"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <DeleteWorkspaceModal
          workspaceName={workspace.name}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </>
  );
});
