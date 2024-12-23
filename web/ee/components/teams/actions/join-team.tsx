import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { AlertModalCore, Button, setPromiseToast } from "@plane/ui";
// plane web hooks
import { useTeams } from "@/plane-web/hooks/store";

type TJoinTeamButtonProps = {
  teamId: string;
};

export const JoinTeamButton = observer((props: TJoinTeamButtonProps) => {
  const { teamId } = props;
  // router
  const { workspaceSlug } = useParams();
  // states
  const [isJoinTeamModalOpen, setIsJoinTeamModalOpen] = useState(false);
  const [isJoinTeamLoading, setIsJoinTeamLoading] = useState(false);
  // store hooks
  const { getTeamById, joinTeam } = useTeams();
  // derived values
  const team = getTeamById(teamId);

  const handleJoinTeam = async () => {
    setIsJoinTeamLoading(true);
    const joinTeamPromise = joinTeam(workspaceSlug?.toString(), teamId);
    setPromiseToast(joinTeamPromise, {
      loading: "Joining team...",
      success: {
        title: "Success",
        message: () => "You are now a member of the team",
      },
      error: {
        title: "Failed",
        message: () => "Failed to join team",
      },
    });
    await joinTeamPromise.finally(() => {
      setIsJoinTeamLoading(false);
      setIsJoinTeamModalOpen(false);
    });
  };

  if (!team) return null;

  return (
    <>
      <AlertModalCore
        variant="primary"
        isOpen={isJoinTeamModalOpen}
        title="Join team"
        primaryButtonText={{
          loading: "Joining",
          default: "Join",
        }}
        content={
          <>
            Are you sure you want to join the team <span className="break-words font-semibold">{team?.name}</span>?
            Please click the <b>Join</b> button below to continue.
          </>
        }
        handleClose={() => setIsJoinTeamModalOpen(false)}
        handleSubmit={handleJoinTeam}
        isSubmitting={isJoinTeamLoading}
      />
      <Button variant="accent-primary" size="sm" onClick={() => setIsJoinTeamModalOpen(true)}>
        Join team
      </Button>
    </>
  );
});
