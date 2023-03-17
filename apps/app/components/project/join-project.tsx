import { FC } from "react";

// ui
import { SecondaryButton } from "components/ui";

export interface JoinProjectProps {
  isJoiningProject: boolean;
  handleJoin: () => void;
}

export const JoinProject: FC<JoinProjectProps> = ({ isJoiningProject, handleJoin }) => (
  <div className="flex h-full w-full items-center justify-center">
    <div className="space-y-4 text-center">
      <h1 className="text-2xl font-bold">You are not a member of this project</h1>
      <p className="mx-auto w-full text-sm md:w-3/4">
        You are not a member of this project, but you can join this project by clicking the button
        below.
      </p>
      <div>
        <SecondaryButton loading={isJoiningProject} onClick={handleJoin}>
          {isJoiningProject ? "Joining..." : "Click to join"}
        </SecondaryButton>
      </div>
    </div>
  </div>
);
