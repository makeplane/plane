import React from "react";

export interface IKanBan {
  issues?: any;
  handleIssues?: () => void;
  handleDragDrop?: () => void;
}

export const KanBan: React.FC<IKanBan> = ({}) => {
  console.log("kanaban layout");
  return (
    <div>
      <div>header</div>
      <div>content</div>
      <div>footer</div>
    </div>
  );
};
