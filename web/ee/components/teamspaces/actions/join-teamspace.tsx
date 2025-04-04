import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { AlertModalCore, Button, setPromiseToast } from "@plane/ui";
// plane web hooks
import { useTeamspaces } from "@/plane-web/hooks/store";

type TJoinTeamButtonProps = {
  teamspaceId: string;
};

export const JoinTeamspaceButton = observer((props: TJoinTeamButtonProps) => {
  const { teamspaceId } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isJoinTeamspaceModalOpen, setIsJoinTeamspaceModalOpen] = useState(false);
  const [isJoinTeamLoading, setIsJoinTeamLoading] = useState(false);
  // store hooks
  const { getTeamspaceById, joinTeam } = useTeamspaces();
  // derived values
  const teamspace = getTeamspaceById(teamspaceId);

  const handleJoinTeam = async () => {
    setIsJoinTeamLoading(true);
    const joinTeamPromise = joinTeam(workspaceSlug?.toString(), teamspaceId);
    setPromiseToast(joinTeamPromise, {
      loading: "Joining teamspace...",
      success: {
        title: "Success",
        message: () => "You are now a member of the teamspace",
      },
      error: {
        title: "Failed",
        message: () => "Failed to join teamspace",
      },
    });
    await joinTeamPromise.finally(() => {
      setIsJoinTeamLoading(false);
      setIsJoinTeamspaceModalOpen(false);
    });
  };

  if (!teamspace) return null;

  return (
    <>
      <AlertModalCore
        variant="primary"
        isOpen={isJoinTeamspaceModalOpen}
        title="Join teamspace"
        primaryButtonText={{
          loading: "Joining",
          default: "Join",
        }}
        content={
          <>
            Are you sure you want to join the teamspace{" "}
            <span className="break-words font-semibold">{teamspace?.name}</span>? Please click the <b>Join</b> button
            below to continue.
          </>
        }
        handleClose={() => setIsJoinTeamspaceModalOpen(false)}
        handleSubmit={handleJoinTeam}
        isSubmitting={isJoinTeamLoading}
      />
      <Button variant="accent-primary" size="sm" onClick={() => setIsJoinTeamspaceModalOpen(true)}>
        Join teamspace
      </Button>
    </>
  );
});
