import {
  CalendarLayoutLoader,
  GanttLayoutLoader,
  KanbanLayoutLoader,
  ListLayoutLoader,
  SpreadsheetLayoutLoader,
} from "./layouts";

export const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const getRandomLength = (lengthArray: string[]) => {
  const randomIndex = Math.floor(Math.random() * lengthArray.length);
  return `${lengthArray[randomIndex]}`;
};

interface Props {
  layout: string;
}
export const ActiveLoader: React.FC<Props> = (props) => {
  const { layout } = props;
  switch (layout) {
    case "list":
      return <ListLayoutLoader />;
    case "kanban":
      return <KanbanLayoutLoader />;
    case "spreadsheet":
      return <SpreadsheetLayoutLoader />;
    case "calendar":
      return <CalendarLayoutLoader />;
    case "gantt_chart":
      return <GanttLayoutLoader />;
    default:
      return <KanbanLayoutLoader />;
  }
};
