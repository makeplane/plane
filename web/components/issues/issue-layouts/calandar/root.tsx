import React from "react";

export interface ICalendarLayout {
  issues: any;
  handleDragDrop: () => void;
}

export const CalendarLayout: React.FC<ICalendarLayout> = ({}) => {
  console.log("kanaban layout");
  return (
    <div>
      <div>header</div>
      <div>content</div>
      <div>footer</div>
    </div>
  );
};
