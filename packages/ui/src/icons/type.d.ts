export interface ISvgIcons extends React.SVGAttributes<SVGElement> {
  className?: string | undefined;
}

export type TIssuePriorities = "urgent" | "high" | "medium" | "low" | "none";

export interface IPriorityIcon {
  priority: TIssuePriorities | null;
  className?: string;
}
