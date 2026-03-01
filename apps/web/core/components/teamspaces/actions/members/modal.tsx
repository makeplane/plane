/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useEffect, useMemo, useState } from "react";
import { uniq } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// Plane imports
import { PlusIcon, ChevronDownIcon, CloseIcon } from "@plane/propel/icons";
import { setToast, TOAST_TYPE } from "@plane/propel/toast";
import { EUserWorkspaceRoles } from "@plane/types";
import { Button } from "@plane/propel/button";
import { Avatar, CustomSearchSelect, EModalPosition, EModalWidth, ModalCore } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web imports
import { useTeamspaces } from "@/plane-web/hooks/store";

type Props = {
  teamspaceId: string | undefined;
  isModalOpen: boolean;
  handleModalClose: () => void;
};

export const AddTeamspaceMembersModal = observer(function AddTeamspaceMembersModal(props: Props) {
  const { teamspaceId, isModalOpen, handleModalClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [memberIdsToInvite, setMemberIdsToInvite] = useState<string[]>([]);
  // store hooks
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { getTeamspaceById, getTeamspaceMemberIds, updateTeamspaceMembers } = useTeamspaces();
  // derived values
  const teamDetail = teamspaceId ? getTeamspaceById(teamspaceId) : undefined;
  const teamspaceMemberIds = teamspaceId ? getTeamspaceMemberIds(teamspaceId) : [];
  const uninvitedPeople = useMemo(
    () =>
      workspaceMemberIds?.filter((userId) => {
        const memberDetails = getWorkspaceMemberDetails(userId);
        if (memberDetails?.role === EUserWorkspaceRoles.GUEST) return false;
        const isInvited = teamspaceMemberIds?.find((u) => u === userId) || memberIdsToInvite?.find((u) => u === userId);
        return !isInvited;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [memberIdsToInvite]
  );
  const isButtonDisabled = useMemo(
    () => memberIdsToInvite.length === 0 || memberIdsToInvite.some((id) => !id),
    [memberIdsToInvite]
  );

  useEffect(() => {
    if (isModalOpen) {
      if (teamDetail) {
        setMemberIdsToInvite([""]);
      } else {
        setMemberIdsToInvite([""]);
      }
    }
  }, [teamDetail, isModalOpen]);

  const handleModalClearAndClose = () => {
    setMemberIdsToInvite([]);
    handleModalClose();
  };

  const handleAddTeamspaceMembers = async () => {
    if (!teamspaceId || !memberIdsToInvite) return;
    // clean up team member ids
    setMemberIdsToInvite(memberIdsToInvite.filter((id) => id !== ""));

    setIsSubmitting(true);
    await updateTeamspaceMembers(
      workspaceSlug?.toString(),
      teamspaceId,
      uniq([...(teamspaceMemberIds ?? []), ...memberIdsToInvite])
    )
      .then(() => {
        handleModalClearAndClose();
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: "Success!",
          message: `Team members added successfully.`,
        });
      })
      .catch((error) => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: "Error!",
          message: error?.error ?? `Failed to add team members. Please try again!`,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const options = uninvitedPeople
    ?.map((userId) => {
      const memberDetails = getWorkspaceMemberDetails(userId);
      if (!memberDetails?.member) return;
      return {
        value: `${memberDetails?.member.id}`,
        query: `${memberDetails?.member.first_name} ${
          memberDetails?.member.last_name
        } ${memberDetails?.member.display_name.toLowerCase()}`,
        content: (
          <div className="flex w-full items-center gap-2">
            <div className="flex-shrink-0 pt-0.5">
              <Avatar name={memberDetails?.member.display_name} src={getFileURL(memberDetails?.member.avatar_url)} />
            </div>
            <div className="truncate">
              {memberDetails?.member.display_name} (
              {memberDetails?.member.first_name + " " + memberDetails?.member.last_name})
            </div>
          </div>
        ),
      };
    })
    .filter((option) => !!option) as
    | {
        value: string;
        query: string;
        content: React.ReactNode;
      }[]
    | undefined;

  if (!isModalOpen) return null;

  return (
    <ModalCore
      isOpen={isModalOpen}
      handleClose={handleModalClearAndClose}
      position={EModalPosition.CENTER}
      width={EModalWidth.XXL}
      className="p-4"
    >
      <div className="space-y-5">
        <h3 className="text-h6-medium leading-6 text-primary">Add coworkers, clients, and consultants</h3>
        <div className="mb-3 space-y-4">
          {memberIdsToInvite.map((memberId, index) => {
            const selectedMember = getWorkspaceMemberDetails(memberId);
            return (
              <div
                key={memberId}
                className="group mb-1 flex items-center justify-between gap-x-4 text-body-xs-regular w-full"
              >
                <div className="flex flex-col gap-1 flex-grow w-full">
                  <CustomSearchSelect
                    value={memberId}
                    customButton={
                      <button className="flex w-full items-center justify-between gap-1 rounded-md border border-subtle-1 px-3 py-1.5 text-left text-body-xs-regular text-secondary shadow-sm duration-300 hover:bg-layer-1-hover hover:text-primary focus:outline-none">
                        {memberId && memberId !== "" ? (
                          <div className="flex items-center gap-2">
                            <Avatar
                              name={selectedMember?.member.display_name}
                              src={getFileURL(selectedMember?.member.avatar_url ?? "")}
                            />
                            {selectedMember?.member.display_name}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 py-0.5">Select co-worker</div>
                        )}
                        <ChevronDownIcon className="h-3 w-3" aria-hidden="true" />
                      </button>
                    }
                    onChange={(val: string) => {
                      setMemberIdsToInvite(
                        memberIdsToInvite.map((_, i) => {
                          if (i === index) {
                            // Don't add if value already exists in array
                            if (memberIdsToInvite.includes(val)) return "";
                            return val;
                          }
                          return _;
                        })
                      );
                    }}
                    options={options}
                    optionsClassName="w-48"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 flex-shrink-0 ">
                  {memberIdsToInvite.length > 1 && (
                    <div className="flex-item flex w-6">
                      <button
                        type="button"
                        className="place-items-center self-center rounded"
                        onClick={() => setMemberIdsToInvite(memberIdsToInvite.filter((_, i) => i !== index))}
                      >
                        <CloseIcon className="h-4 w-4 text-secondary" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <button
          type="button"
          className="flex items-center gap-1.5 bg-transparent py-2 pr-3 text-body-xs-medium text-accent-primary outline-accent-strong"
          onClick={() => setMemberIdsToInvite([...memberIdsToInvite, ""])}
        >
          <PlusIcon className="h-4 w-4" />
          Add another
        </button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleModalClearAndClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            loading={isSubmitting}
            disabled={isButtonDisabled}
            onClick={handleAddTeamspaceMembers}
          >
            {isSubmitting
              ? `${memberIdsToInvite && memberIdsToInvite.length > 1 ? "Adding members" : "Adding member"}`
              : `${memberIdsToInvite && memberIdsToInvite.length > 1 ? "Add members" : "Add member"}`}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
