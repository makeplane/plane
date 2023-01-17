import { useState, FC } from "react";
// ui
import { Button, Spinner } from "components/ui";
// services
import projectService from "services/project.service";

export interface JoinProjectProps {
  isJoiningProject: boolean;
  handleJoin: () => void;
}

export const JoinProject: FC<JoinProjectProps> = (props) => {
  const { isJoiningProject, handleJoin } = props;

  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">You are not a member of this project</h1>
        <p className="mx-auto w-full text-sm md:w-3/4">
          You are not a member of this project, but you can join this project by clicking the button
          below.
        </p>
        <div>
          <Button type="button" disabled={isJoiningProject} onClick={handleJoin}>
            Click to join
          </Button>
        </div>
      </div>
    </div>
  );
};
