import { FC, useEffect, useMemo, useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { ChevronDown, Plus, X } from "lucide-react";
// ui
import {
  Avatar,
  Button,
  CustomSearchSelect,
  EModalPosition,
  EModalWidth,
  ModalCore,
  setToast,
  TOAST_TYPE,
} from "@plane/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

type Props = {
  teamId: string | undefined;
  isModalOpen: boolean;
  handleModalClose: () => void;
};

export const AddTeamMembersModal: FC<Props> = observer((props) => {
  const { teamId, isModalOpen, handleModalClose } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [teamMemberIds, setTeamMemberIds] = useState<string[]>([]);
  // store hooks
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { getTeamById, getTeamMemberIds, addTeamMembers } = useTeams();
  // derived values
  const teamDetail = teamId ? getTeamById(teamId) : undefined;
  const memberIds = teamId ? getTeamMemberIds(teamId) : [];
  const uninvitedPeople = useMemo(
    () =>
      workspaceMemberIds?.filter((userId) => {
        const isInvited = memberIds?.find((u) => u === userId) || teamMemberIds?.find((u) => u === userId);
        return !isInvited;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teamMemberIds]
  );
  const isButtonDisabled = useMemo(
    () => teamMemberIds.length === 0 || teamMemberIds.some((id) => !id),
    [teamMemberIds]
  );

  useEffect(() => {
    if (isModalOpen) {
      if (teamDetail) {
        setTeamMemberIds([""]);
      } else {
        setTeamMemberIds([""]);
      }
    }
  }, [teamDetail, isModalOpen]);

  const handleModalClearAndClose = () => {
    setTeamMemberIds([]);
    handleModalClose();
  };

  const handleAddTeamMembers = async () => {
    if (!teamId || !teamMemberIds) return;
    // clean up team member ids
    setTeamMemberIds(teamMemberIds.filter((id) => id !== ""));

    setIsSubmitting(true);
    await addTeamMembers(workspaceSlug?.toString(), teamId, teamMemberIds)
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
        content: React.JSX.Element;
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
        <h3 className="text-lg font-medium leading-6 text-custom-text-100">Add coworkers, clients, and consultants</h3>
        <div className="mb-3 space-y-4">
          {teamMemberIds.map((memberId, index) => {
            const selectedMember = getWorkspaceMemberDetails(memberId);
            return (
              <div key={memberId} className="group mb-1 flex items-center justify-between gap-x-4 text-sm w-full">
                <div className="flex flex-col gap-1 flex-grow w-full">
                  <CustomSearchSelect
                    value={memberId}
                    customButton={
                      <button className="flex w-full items-center justify-between gap-1 rounded-md border border-custom-border-200 px-3 py-1.5 text-left text-sm text-custom-text-200 shadow-sm duration-300 hover:bg-custom-background-80 hover:text-custom-text-100 focus:outline-none">
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
                        <ChevronDown className="h-3 w-3" aria-hidden="true" />
                      </button>
                    }
                    onChange={(val: string) => {
                      setTeamMemberIds(
                        teamMemberIds.map((_, i) => {
                          if (i === index) {
                            // Don't add if value already exists in array
                            if (teamMemberIds.includes(val)) return "";
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
                  {teamMemberIds.length > 1 && (
                    <div className="flex-item flex w-6">
                      <button
                        type="button"
                        className="place-items-center self-center rounded"
                        onClick={() => setTeamMemberIds(teamMemberIds.filter((_, i) => i !== index))}
                      >
                        <X className="h-4 w-4 text-custom-text-200" />
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
          className="flex items-center gap-1.5 bg-transparent py-2 pr-3 text-sm font-medium text-custom-primary outline-custom-primary"
          onClick={() => setTeamMemberIds([...teamMemberIds, ""])}
        >
          <Plus className="h-4 w-4" />
          Add another
        </button>
        <div className="flex items-center gap-2">
          <Button variant="neutral-primary" size="sm" onClick={handleModalClearAndClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="button"
            loading={isSubmitting}
            disabled={isButtonDisabled}
            onClick={handleAddTeamMembers}
          >
            {isSubmitting
              ? `${teamMemberIds && teamMemberIds.length > 1 ? "Adding members" : "Adding member"}`
              : `${teamMemberIds && teamMemberIds.length > 1 ? "Add members" : "Add member"}`}
          </Button>
        </div>
      </div>
    </ModalCore>
  );
});
