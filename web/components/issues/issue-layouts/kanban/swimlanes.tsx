import React from "react";

export interface IKanBanSwimLanes {
  issues?: any;
  handleIssues?: () => void;
  handleDragDrop?: () => void;
}

export const KanBanSwimLanes: React.FC<IKanBanSwimLanes> = ({}) => {
  console.log("");

  return (
    <div>
      <div>header</div>
      <div>content</div>
      <div>footer</div>
    </div>
  );
};
