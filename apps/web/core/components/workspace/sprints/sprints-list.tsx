/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { AlertTriangle, Globe2, Lock } from "lucide-react";
import { EUserPermissions, EUserPermissionsLevel } from "@plane/constants";
import { Button } from "@plane/propel/button";
import { EmojiIconPickerTypes, EmojiPicker, Logo } from "@plane/propel/emoji-icon-picker";
import { CycleIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { IWorkspaceSprintAutomation, TLogoProps } from "@plane/types";
import { Checkbox, EModalPosition, EModalWidth, Input, ModalCore } from "@plane/ui";
import { cn } from "@plane/utils";
import { useMember } from "@/hooks/store/use-member";
import { useUserPermissions } from "@/hooks/store/user";
import { useWorkspaceSprint } from "@/hooks/store/use-workspace-sprint";
import { SprintCreateModal } from "./sprint-modal";

type Props = {
  automationId: string;
};

const formatDate = (date: string | null) => {
  if (!date) return "No date";
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(date));
};

const SPRINT_GROUP_ACCESS = {
  PRIVATE: 0,
  PUBLIC: 2,
} as const;

const formatLogoProps = (value: any): TLogoProps => {
  let logoValue = {};

  if (value?.type === "emoji") logoValue = { value: value.value };
  else if (value?.type === "icon") logoValue = value.value;

  return {
    in_use: value?.type,
    [value?.type]: logoValue,
  } as TLogoProps;
};

const deleteDefaultValues = {
  sprintGroupName: "",
  confirmDelete: "",
};

export const WorkspaceSprintsList = observer(function WorkspaceSprintsList(props: Props) {
  const { automationId } = props;
  const { workspaceSlug } = useParams();
  const searchParams = useSearchParams();
  const [showArchived, setShowArchived] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLogoPickerOpen, setIsLogoPickerOpen] = useState(false);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const {
    completeWorkspaceSprint,
    fetchArchivedWorkspaceSprints,
    fetchWorkspaceSprintSquadMembers,
    fetchWorkspaceSprints,
    getArchivedSprintsBySquadId,
    getSprintSquadById,
    getSprintById,
    getSprintsBySquadId,
    updateWorkspaceSprintSquad,
    updateWorkspaceSprintSquadMembers,
  } = useWorkspaceSprint();
  const {
    workspace: { fetchWorkspaceMembers, getWorkspaceMemberIds },
    getUserDetails,
  } = useMember();
  const { allowPermissions } = useUserPermissions();

  const workspaceSlugValue = workspaceSlug?.toString();
  const automation = getSprintSquadById(automationId);
  const sprintIds = showArchived ? getArchivedSprintsBySquadId(automationId) : getSprintsBySquadId(automationId);
  const isSettingsView = searchParams.get("view") === "settings";
  const selectedMemberIds = automation?.member_ids ?? [];
  const workspaceMemberIds = workspaceSlugValue ? getWorkspaceMemberIds(workspaceSlugValue) : [];
  const canManageAccess = allowPermissions([EUserPermissions.ADMIN], EUserPermissionsLevel.WORKSPACE);

  useEffect(() => {
    if (!workspaceSlugValue || !automationId) return;
    fetchWorkspaceSprints(workspaceSlugValue, automationId);
    fetchArchivedWorkspaceSprints(workspaceSlugValue, automationId);
  }, [automationId, fetchArchivedWorkspaceSprints, fetchWorkspaceSprints, workspaceSlugValue]);

  useEffect(() => {
    if (!workspaceSlugValue || !automationId) return;
    fetchWorkspaceMembers(workspaceSlugValue);
    fetchWorkspaceSprintSquadMembers(workspaceSlugValue, automationId);
  }, [automationId, fetchWorkspaceMembers, fetchWorkspaceSprintSquadMembers, workspaceSlugValue]);

  const handleComplete = async (sprintId: string) => {
    if (!workspaceSlugValue) return;
    try {
      await completeWorkspaceSprint(workspaceSlugValue, sprintId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Sprint completed",
        message: "Completed sprints are available in Archived.",
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not complete sprint",
        message: "Please try again.",
      });
    }
  };

  const handleAccessChange = async (access: (typeof SPRINT_GROUP_ACCESS)[keyof typeof SPRINT_GROUP_ACCESS]) => {
    if (!workspaceSlugValue || !automation || automation.access === access) return;

    try {
      await updateWorkspaceSprintSquad(workspaceSlugValue, automation.id, { access });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Sprint access updated",
        message:
          access === SPRINT_GROUP_ACCESS.PUBLIC
            ? "Everyone in the workspace can access it."
            : "Only selected members can access it.",
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not update sprint access",
        message: "Please try again.",
      });
    }
  };

  const handleLogoChange = async (logoProps: TLogoProps) => {
    if (!workspaceSlugValue || !automation) return;

    try {
      await updateWorkspaceSprintSquad(workspaceSlugValue, automation.id, { logo_props: logoProps });
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Squad icon updated",
        message: "The squad icon has been updated.",
      });
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not update squad icon",
        message: "Please try again.",
      });
    }
  };

  const handleMemberToggle = async (memberId: string, checked: boolean) => {
    if (!workspaceSlugValue || !automation) return;

    const nextMemberIds = checked
      ? Array.from(new Set([...selectedMemberIds, memberId]))
      : selectedMemberIds.filter((selectedMemberId) => selectedMemberId !== memberId);

    try {
      await updateWorkspaceSprintSquadMembers(workspaceSlugValue, automation.id, nextMemberIds);
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Could not update sprint members",
        message: "Please try again.",
      });
    }
  };

  return (
    <>
      {automation && workspaceSlugValue && (
        <>
          <ArchiveSprintGroupModal
            workspaceSlug={workspaceSlugValue}
            automation={automation}
            isOpen={isArchiveModalOpen}
            onClose={() => setIsArchiveModalOpen(false)}
          />
          <DeleteSprintGroupModal
            workspaceSlug={workspaceSlugValue}
            automation={automation}
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
          />
        </>
      )}
      <SprintCreateModal
        automationId={automationId}
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <div className="flex h-full w-full flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-subtle px-5 py-3">
          <div>
            <h2 className="text-16 font-semibold text-primary">{isSettingsView ? "Squad settings" : "Open sprints"}</h2>
            <p className="text-12 text-tertiary">
              {automation
                ? `${automation.sprint_duration_days} day sprint • ${automation.name_template}`
                : "Manage active sprints"}
            </p>
          </div>
          {!isSettingsView && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived(false)}
                className={cn({ "bg-layer-transparent-active": !showArchived })}
              >
                Open
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowArchived(true)}
                className={cn({ "bg-layer-transparent-active": showArchived })}
              >
                Archived
              </Button>
              {!showArchived && (
                <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
                  Add sprint
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="vertical-scrollbar h-full overflow-y-auto p-5">
          {isSettingsView && automation && (
            <>
              <div className="mb-5 rounded-md border border-subtle bg-surface-1 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-14 font-medium text-primary">Squad icon</h3>
                    <p className="mt-1 text-12 text-tertiary">Choose the icon shown in squad navigation.</p>
                  </div>
                  <EmojiPicker
                    iconType="material"
                    closeOnSelect={false}
                    isOpen={isLogoPickerOpen}
                    handleToggle={(value: boolean) => setIsLogoPickerOpen(value)}
                    className="flex items-center justify-center"
                    buttonClassName="flex size-9 flex-shrink-0 items-center justify-center rounded-md bg-surface-2"
                    label={
                      automation.logo_props?.in_use ? (
                        <Logo logo={automation.logo_props} size={18} type="material" />
                      ) : (
                        <CycleIcon className="size-4" />
                      )
                    }
                    onChange={(value: any) => {
                      handleLogoChange(formatLogoProps(value));
                      setIsLogoPickerOpen(false);
                    }}
                    defaultIconColor={
                      automation.logo_props?.in_use === "icon" ? automation.logo_props?.icon?.color : undefined
                    }
                    defaultOpen={
                      automation.logo_props?.in_use === "emoji" ? EmojiIconPickerTypes.EMOJI : EmojiIconPickerTypes.ICON
                    }
                    disabled={!canManageAccess}
                  />
                </div>
              </div>
              <div className="mb-5 rounded-md border border-subtle bg-surface-1 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-14 font-medium text-primary">Squad access</h3>
                    <p className="mt-1 text-12 text-tertiary">Control who can see this squad and its sprints.</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canManageAccess}
                      onClick={() => handleAccessChange(SPRINT_GROUP_ACCESS.PUBLIC)}
                      className={cn({
                        "bg-layer-transparent-active": automation.access === SPRINT_GROUP_ACCESS.PUBLIC,
                      })}
                    >
                      <Globe2 className="mr-1 size-3.5" />
                      Public
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={!canManageAccess}
                      onClick={() => handleAccessChange(SPRINT_GROUP_ACCESS.PRIVATE)}
                      className={cn({
                        "bg-layer-transparent-active": automation.access === SPRINT_GROUP_ACCESS.PRIVATE,
                      })}
                    >
                      <Lock className="mr-1 size-3.5" />
                      Private
                    </Button>
                  </div>
                </div>
                {automation.access === SPRINT_GROUP_ACCESS.PRIVATE && (
                  <div className="mt-4 border-t border-subtle pt-4">
                    <div className="mb-2 text-12 font-medium text-secondary">Allowed members</div>
                    <div className="max-h-56 space-y-1 overflow-y-auto">
                      {workspaceMemberIds.map((memberId) => {
                        const member = getUserDetails(memberId);
                        if (!member) return null;
                        return (
                          <div
                            key={memberId}
                            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-surface-2"
                          >
                            <Checkbox
                              checked={selectedMemberIds.includes(memberId)}
                              disabled={!canManageAccess}
                              onChange={(event) => handleMemberToggle(memberId, event.target.checked)}
                            />
                            <div className="min-w-0">
                              <div className="truncate text-13 text-primary">{member.display_name}</div>
                              <div className="truncate text-11 text-tertiary">{member.email}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="rounded-md border border-subtle bg-surface-1">
                <div className="flex items-start justify-between gap-4 border-b border-subtle px-4 py-3">
                  <div>
                    <h3 className="text-14 font-medium text-primary">Archive</h3>
                    <p className="mt-1 text-12 text-tertiary">
                      Archiving a squad will remove it from squad navigation. Existing sprints and work items remain
                      available.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={!canManageAccess}
                    onClick={() => setIsArchiveModalOpen(true)}
                  >
                    Archive
                  </Button>
                </div>
                <div className="flex items-start justify-between gap-4 px-4 py-3">
                  <div>
                    <h3 className="text-14 font-medium text-primary">Delete</h3>
                    <p className="mt-1 text-12 text-tertiary">
                      When deleting a squad, its configuration and sprint grouping will be permanently removed and
                      cannot be recovered.
                    </p>
                  </div>
                  <Button
                    variant="error-outline"
                    size="sm"
                    disabled={!canManageAccess}
                    onClick={() => setIsDeleteModalOpen(true)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
          {!isSettingsView &&
            (sprintIds.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed border-subtle text-13 text-tertiary">
                {showArchived ? "No archived sprints yet." : "No open sprints yet."}
              </div>
            ) : (
              <div className="space-y-2">
                {sprintIds.map((sprintId: string) => {
                  const sprint = getSprintById(sprintId);
                  if (!sprint) return null;
                  return (
                    <div
                      key={sprint.id}
                      className="flex items-center justify-between rounded-md border border-subtle bg-surface-1 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-14 font-medium text-primary">{sprint.name}</h3>
                          {sprint.status && (
                            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-11 text-tertiary capitalize">
                              {sprint.status}
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-12 text-tertiary">
                          {formatDate(sprint.start_date)} - {formatDate(sprint.end_date)} • {sprint.total_issues ?? 0}{" "}
                          work items
                        </p>
                      </div>
                      {!showArchived && (
                        <Button variant="ghost" size="sm" onClick={() => handleComplete(sprint.id)}>
                          Complete sprint
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      </div>
    </>
  );
});

type TSprintGroupModalProps = {
  workspaceSlug: string;
  automation: IWorkspaceSprintAutomation;
  isOpen: boolean;
  onClose: () => void;
};

function ArchiveSprintGroupModal(props: TSprintGroupModalProps) {
  const { workspaceSlug, automation, isOpen, onClose } = props;
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { archiveWorkspaceSprintSquad } = useWorkspaceSprint();

  const handleClose = () => {
    setIsLoading(false);
    onClose();
  };

  const handleArchive = async () => {
    setIsLoading(true);

    try {
      await archiveWorkspaceSprintSquad(workspaceSlug, automation.id);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Archive success",
        message: `${automation.name} has been archived successfully`,
      });
      onClose();
      router.push(`/${workspaceSlug}/sprints`);
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Squad could not be archived. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.LG}>
      <div className="px-5 py-4">
        <h3 className="text-18 font-medium 2xl:text-20">Archive {automation.name}</h3>
        <p className="mt-3 text-13 text-secondary">
          This squad will be archived and removed from squad navigation. Its sprints and work items will remain
          available in their projects.
        </p>
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="lg" onClick={handleArchive} loading={isLoading}>
            {isLoading ? "Archiving" : "Archive"}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
}

function DeleteSprintGroupModal(props: TSprintGroupModalProps) {
  const { workspaceSlug, automation, isOpen, onClose } = props;
  const router = useRouter();
  const { deleteWorkspaceSprintSquad } = useWorkspaceSprint();
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    reset,
    watch,
  } = useForm({ defaultValues: deleteDefaultValues });

  const canDelete = watch("sprintGroupName") === automation.name && watch("confirmDelete") === "delete squad";

  const handleClose = () => {
    const timer = setTimeout(() => {
      reset(deleteDefaultValues);
      clearTimeout(timer);
    }, 350);

    onClose();
  };

  const onSubmit = async () => {
    if (!canDelete) return;

    try {
      await deleteWorkspaceSprintSquad(workspaceSlug, automation.id);
      handleClose();
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Squad deleted successfully.",
      });
      router.push(`/${workspaceSlug}/sprints`);
    } catch (_error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Something went wrong. Please try again later.",
      });
    }
  };

  return (
    <ModalCore isOpen={isOpen} handleClose={handleClose} position={EModalPosition.CENTER} width={EModalWidth.XXL}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 p-6">
        <div className="flex w-full items-center justify-start gap-6">
          <span className="place-items-center rounded-full bg-danger-subtle p-4">
            <AlertTriangle className="h-6 w-6 text-danger-primary" aria-hidden="true" />
          </span>
          <span className="flex items-center justify-start">
            <h3 className="text-18 font-medium 2xl:text-20">Delete squad</h3>
          </span>
        </div>
        <span>
          <p className="text-13 leading-7 text-secondary">
            Are you sure you want to delete squad <span className="font-semibold break-words">{automation.name}</span>?
            All of the squad configuration will be permanently removed. This action cannot be undone
          </p>
        </span>
        <div className="text-secondary">
          <p className="text-13 break-words">
            Enter the squad name <span className="font-medium text-primary">{automation.name}</span> to continue:
          </p>
          <Controller
            control={control}
            name="sprintGroupName"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="sprintGroupName"
                name="sprintGroupName"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.sprintGroupName)}
                placeholder="Squad name"
                className="mt-2 w-full"
                autoComplete="off"
              />
            )}
          />
        </div>
        <div className="text-secondary">
          <p className="text-13">
            To confirm, type <span className="font-medium text-primary">delete squad</span> below:
          </p>
          <Controller
            control={control}
            name="confirmDelete"
            render={({ field: { value, onChange, ref } }) => (
              <Input
                id="confirmDelete"
                name="confirmDelete"
                type="text"
                value={value}
                onChange={onChange}
                ref={ref}
                hasError={Boolean(errors.confirmDelete)}
                placeholder="Enter 'delete squad'"
                className="mt-2 w-full"
                autoComplete="off"
              />
            )}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" size="lg" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="error-fill" size="lg" type="submit" disabled={!canDelete} loading={isSubmitting}>
            {isSubmitting ? "Deleting" : "Delete squad"}
          </Button>
        </div>
      </form>
    </ModalCore>
  );
}
